import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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

    selectedWork: any = null;
    memberId = '';
    orgId = '';
    memberDetails: any = null;

    tasksPendingReview: any[] = [];
    tasksCompleted: any[] = [];

    isLoading = true;

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

    loadRealMemberData() {
        this.http.get<any[]>(`${environment.apiUrl}/users/org/${this.orgId}/leaderboard`)
            .subscribe(members => {
                this.memberDetails = members.find(m => m.id === this.memberId);

                if (!this.memberDetails) {
                    console.error("Member not found!");
                    this.router.navigate(['/dashboard']);
                    return;
                }

                this.taskService.getTasks(this.orgId).subscribe(tasks => {

                    // 1. Filter tasks for this specific member securely
                    const memberTasks = tasks.filter(t => {
                        if (!t.assignedTo) return false;
                        return Array.isArray(t.assignedTo)
                            ? t.assignedTo.includes(this.memberId)
                            : t.assignedTo === this.memberId;
                    });

                    // 2. Map Pending Reviews (Checking Status vs status)
                    // 2. Map Pending Reviews (Checking Status vs status)
                    this.tasksPendingReview = memberTasks
                        .filter(t => (t.status || (t as any).Status || '').toLowerCase() === 'review')
                        .map(t => ({
                            attemptId: t.id || (t as any).Id,
                            title: t.title || (t as any).Title,
                            baseXp: t.xpReward || (t as any).XpReward,
                            customXp: t.xpReward || (t as any).XpReward,

                            // 🚨 THE FIX: Map the task type so the HTML can see it!
                            taskType: (t.type || (t as any).Type || 'coding').toLowerCase(),

                            submittedAt: new Date()
                        }));

                    // 3. Map Completed Tasks
                    this.tasksCompleted = memberTasks
                        .filter(t => (t.status || (t as any).Status || '').toLowerCase() === 'completed')
                        .map(t => ({
                            attemptId: t.id || (t as any).Id,
                            title: t.title || (t as any).Title,
                            earnedXp: t.xpReward || (t as any).XpReward,

                            // 🚨 Same here, grab the type just in case we need it later
                            taskType: (t.type || (t as any).Type || 'coding').toLowerCase(),

                            completedAt: new Date()
                        }));

                    this.isLoading = false;
                    this.cdr.detectChanges();
                });
            });
    }

    // 🚨 NEW: Methods to handle the modal
    viewWork(task: any) {
        this.selectedWork = task;
        this.cdr.detectChanges();
    }

    closeWorkModal() {
        this.selectedWork = null;
        this.cdr.detectChanges();
    }

    approveTask(task: any) {
        const finalXp = task.customXp;

        this.taskService.approveTaskAttempt(task.attemptId, finalXp)
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

                // 1. Grab a copy of the task BEFORE we destroy it
                const gradedTask = this.tasksPendingReview.find(t => t.attemptId === attemptId);

                if (gradedTask) {
                    // 2. 🚨 THE FIX: Completely reassign the pending array so Angular triggers a repaint
                    this.tasksPendingReview = this.tasksPendingReview.filter(t => t.attemptId !== attemptId);

                    // 3. Completely reassign the completed array, placing the new task at the top
                    this.tasksCompleted = [
                        {
                            ...gradedTask,
                            earnedXp: response.xpAwarded,
                            score: response.score,
                            completedAt: new Date()
                        },
                        ...this.tasksCompleted
                    ];

                    // 4. Update the total XP on the profile
                    if (this.memberDetails) {
                        this.memberDetails.xp += response.xpAwarded;
                    }

                    // 5. Force the UI to sync
                    this.cdr.detectChanges();
                } else {
                    // Just in case the ID mismatch is the actual culprit
                    console.warn(`Attempt ID [${attemptId}] not found in tasksPendingReview array!`);
                }
            },
            error: (err) => {
                console.error('Failed to evaluate quiz:', err);
                alert('Server Error: Could not evaluate the quiz. Check console.');
            }
        });
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }
}