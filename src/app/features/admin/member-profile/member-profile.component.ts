import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { TaskService } from '@core/services/task.service';
import { AuthService } from '@core/services/auth.service';

@Component({
    selector: 'app-member-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './member-profile.component.html',
    styleUrl: './member-profile.component.scss'
})
export class MemberProfileComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private taskService = inject(TaskService);
    private authService = inject(AuthService);
    private ngZone = inject(NgZone);

    selectedWork: any = null;
    memberId = '';
    orgId = '';
    memberDetails: any = null;

    tasksPendingReview: any[] = [];
    tasksCompleted: any[] = [];

    isLoading = true;
    // 🚨 NEW: State for our beautiful custom Toast notification
    toastConfig = { show: false, title: '', message: '', score: '', xp: 0, type: 'success' };

    ngOnInit() {
        this.memberId = this.route.snapshot.paramMap.get('id') || '';

        // Get the current Admin's OrgId to fetch the right data
        this.authService.currentUser$.subscribe(user => {
            if (user && user.orgId) {
                this.orgId = user.orgId;
                this.loadRealMemberData();
            }
        });
    }

    showToast(title: string, message: string, score: string = '', xp: number = 0, type: 'success' | 'error' = 'success') {
        this.toastConfig = { show: true, title, message, score, xp, type };

        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.toastConfig.show = false;
            this.cdr.detectChanges();
        }, 4000);
    }

    loadRealMemberData() {
        this.http.get<any[]>(`${environment.apiUrl}/users/org/${this.orgId}/leaderboard`)
            .subscribe(members => {
                this.memberDetails = members.find(m => m.id === this.memberId);

                if (!this.memberDetails) {
                    console.error("Member not found!");
                    this.router.navigate(['/dashboard']);
                    return;
                }

                // 🚨 FIX 1: Pass `this.memberId` so the backend knows to attach THIS specific student's attempts!
                this.taskService.getTasks(this.orgId, this.memberId).subscribe(tasks => {

                    // 1. Filter tasks for this specific member securely
                    const memberTasks = tasks.filter(t => {
                        if (!t.assignedTo) return false;
                        return Array.isArray(t.assignedTo)
                            ? t.assignedTo.includes(this.memberId)
                            : t.assignedTo === this.memberId;
                    });

                    // 2. Map Pending Reviews
                    this.tasksPendingReview = memberTasks
                        .filter(t => (t.status || (t as any).Status || '').toLowerCase() === 'review')
                        .map(t => ({
                            // 🚨 FIX 2: Grab the explicitly injected attemptId from the C# backend!
                            attemptId: t.attemptId || t.id,
                            title: t.title || (t as any).Title,
                            baseXp: t.xpReward || (t as any).XpReward,
                            customXp: t.xpReward || (t as any).XpReward,
                            taskType: (t.type || (t as any).Type || 'coding').toLowerCase(),
                            submittedAt: new Date()
                        }));

                    // 3. Map Completed Tasks
                    this.tasksCompleted = memberTasks
                        .filter(t => (t.status || (t as any).Status || '').toLowerCase() === 'completed')
                        .map(t => ({
                            // 🚨 Same fix here!
                            attemptId: t.attemptId || t.id,
                            title: t.title || (t as any).Title,
                            earnedXp: t.earnedXp || t.xpReward || (t as any).XpReward,
                            taskType: (t.type || (t as any).Type || 'coding').toLowerCase(),
                            completedAt: new Date()
                        }));

                    this.isLoading = false;
                    this.cdr.detectChanges();
                });
            });
    }

    // 🚨 NEW: Methods to handle the modal
    // 🚨 THE FIX: Fetch the heavy code payload on-demand when the Admin clicks View!
    viewWork(task: any) {
        // 1. Open the modal immediately with a loading state
        this.selectedWork = { ...task, isLoading: true };
        this.cdr.detectChanges();

        // 2. Fetch the full attempt details from the backend
        this.taskService.getTaskById(task.attemptId).subscribe({
            next: (fullTaskDetails: any) => {
                // 🚨 THE FIX: Force Angular to recognize the data change immediately!
                this.ngZone.run(() => {
                    this.selectedWork = {
                        ...task,
                        ...fullTaskDetails,
                        isLoading: false
                    };
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {// 🚨 THE FIX: Do the same for errors so the loading spinner stops!
                this.ngZone.run(() => {
                    console.error("Failed to load full student work", err);
                    this.selectedWork.isLoading = false;
                    this.selectedWork.error = true;
                    this.cdr.detectChanges();
                });
            }
        });
    }

    closeWorkModal() {
        this.selectedWork = null;
        this.cdr.detectChanges();
    }

    approveTask(task: any) {
        const finalXp = task.customXp;

        // 🚨 Pass this.memberId to the service so the backend grades the exact student!
        this.taskService.approveTaskAttempt(task.attemptId, finalXp, this.memberId)
            .subscribe({
                next: () => {
                    this.tasksPendingReview = this.tasksPendingReview.filter(t => t.attemptId !== task.attemptId);
                    this.tasksCompleted.unshift({ ...task, earnedXp: finalXp, completedAt: new Date() });

                    if (this.memberDetails) {
                        this.memberDetails.xp += finalXp;
                    }
                    this.cdr.detectChanges();
                },
                error: (err) => console.error('Failed to grade task', err)
            });
    }

    // 🚨 UPDATED: Using Immutable Array Reassignment for guaranteed UI updates
    gradeQuiz(attemptId: string) {
        this.taskService.evaluateQuiz(attemptId).subscribe({
            next: (response) => {
                console.log('Quiz Evaluation Complete:', response);

                // 🚨 THE UX UPGRADE: Call our beautiful custom Toast instead of alert()!
                this.showToast(
                    'Quiz Evaluated Successfully!',
                    'The student\'s submission has been automatically graded.',
                    response.score,
                    response.xpAwarded,
                    'success'
                );

                const gradedTask = this.tasksPendingReview.find(t => t.attemptId === attemptId);

                if (gradedTask) {
                    this.tasksPendingReview = this.tasksPendingReview.filter(t => t.attemptId !== attemptId);

                    this.tasksCompleted = [
                        {
                            ...gradedTask,
                            earnedXp: response.xpAwarded,
                            score: response.score,
                            completedAt: new Date()
                        },
                        ...this.tasksCompleted
                    ];

                    if (this.memberDetails) {
                        this.memberDetails.xp += response.xpAwarded;
                    }
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('Failed to evaluate quiz:', err);
                this.showToast('Evaluation Failed', 'Server error: Could not evaluate the quiz.', '', 0, 'error');
            }
        });
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }
}