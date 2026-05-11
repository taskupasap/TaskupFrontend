import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.development';
import { TaskService } from '../../../core/services/task.service';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe'; // Adjust path if needed
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer.component' // Adjust path accordingly

@Component({
    selector: 'app-task-execution',
    standalone: true,
    imports: [CommonModule, FormsModule, PdfViewerComponent, SafeUrlPipe],
    templateUrl: './task-execution.component.html',
    styleUrl: './task-execution.component.scss'
})
export class TaskExecutionComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private http = inject(HttpClient);
    private taskService = inject(TaskService);
    private cdr = inject(ChangeDetectorRef);
    private ngZone = inject(NgZone);
    private location = inject(Location);

    taskId = '';
    viewState: 'intro' | 'active' | 'submitted' = 'intro';
    isProcessing = false;
    consentGiven = false;

    taskDetails: any = {
        title: '',
        type: 'coding', // 'coding' | 'quiz' | 'course'
        description: '',
        timeLimitSeconds: 1800,
        attachmentUrl: null,
        readContent: '', // For course types
        questions: []    // For quiz types
    };

    // --- 💻 CODING STATE VARIABLES ---
    availableLanguages: any[] = [];
    selectedLangId = '';
    codeContent = '';
    testStatus: 'idle' | 'running' | 'passed' | 'failed' = 'idle';
    terminalOutput: string = 'Ready to run test cases...';
    testMetrics: any = null;

    // --- 📝 QUIZ STATE VARIABLES ---
    // Key: Question Index, Value: Selected Option String
    quizAnswers: { [key: number]: string } = {};

    // --- 📚 COURSE STATE VARIABLES ---
    hasReadDocument = false; // Ensures they click the checkbox before finishing course

    // --- ⏱️ TIMER VARIABLES ---
    endTime: number | null = null;
    timeLeft = 0;
    timerDisplay = '00:00';
    private timerInterval: any;
    submissionType: 'manual' | 'timeout' = 'manual';

    ngOnInit() {
        this.taskId = this.route.snapshot.paramMap.get('id') || '';

        // 1. Fetch Task Details
        this.taskService.getTaskById(this.taskId).subscribe((task: any) => {
            this.taskDetails = {
                ...this.taskDetails,
                title: task.title || task.Title || 'Assessment Challenge',
                type: (task.type || task.Type || 'coding').toLowerCase(),
                description: task.description || task.Description || '',
                timeLimitSeconds: task.timeLimitSeconds || task.TimeLimitSeconds || 1800,
                attachmentUrl: task.attachmentUrl || task.AttachmentUrl || null,
                readContent: task.readContent || task.ReadContent || '',
                questions: task.questions || task.Questions || []
            };

            // 2. Load available languages if it's a coding task
            if (this.taskDetails.type === 'coding') {
                this.taskService.getSupportedLanguages().subscribe(langs => {
                    this.availableLanguages = langs;
                    const saved = localStorage.getItem(`task_state_${this.taskId}`);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        this.selectedLangId = parsed.selectedLangId || langs[0].id;
                    } else {
                        this.selectedLangId = langs[0].id;
                    }
                    this.cdr.detectChanges();
                });
            }

            this.restoreState();
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() { this.clearTimer(); }

    get taskInstructions(): string[] {
        const type = (this.taskDetails?.type || 'coding').toLowerCase();
        switch (type) {
            case 'coding':
                return [
                    'Read the problem statement and reference materials carefully on the left panel.',
                    'Write your solution in the right panel using your preferred programming language.',
                    'Click "▶ Run Code" to validate your script against our live compiler.',
                    'Do NOT refresh the page or navigate away, as the timer will keep ticking.',
                    'Click "Cloud Submit" before the timer expires to lock in your answer.'
                ];
            case 'quiz':
                return [
                    'Read each question carefully and select the best possible answer choice.',
                    'You can modify your choices at any point before submitting.',
                    'Do NOT close this tab, as your timer progress will not pause.',
                    'Click "Submit Quiz" at the top right once all questions have been filled.'
                ];
            case 'course':
                return [
                    'Carefully read the provided textual documentation below.',
                    'If a reference file or PDF is attached, open and read it thoroughly.',
                    'Once completed, tick the verification checkbox to unlock the submit button.',
                    'Click the "Complete Course" button to finalize and earn your XP.'
                ];
            default:
                return ['Please read the instructions provided and submit on time.'];
        }
    }

    restoreState() {
        const saved = localStorage.getItem(`task_state_${this.taskId}`);
        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed.viewState === 'active') {

                // 🚨 THE FIX: Courses are always active, skip time checks
                if (this.taskDetails.type === 'course') {
                    this.viewState = 'active';
                    return;
                }

                const now = Date.now();
                if (now < parsed.endTime) {
                    this.viewState = 'active';
                    this.endTime = parsed.endTime;
                    this.timeLeft = Math.floor((this.endTime! - now) / 1000);
                    this.updateTimerDisplay();

                    if (this.taskDetails.type === 'coding') {
                        this.codeContent = parsed.codeContent || '';
                        this.selectedLangId = parsed.selectedLangId || this.selectedLangId;
                    } else if (this.taskDetails.type === 'quiz') {
                        this.quizAnswers = parsed.quizAnswers || {};
                    }

                    this.startTimer();
                } else {
                    this.submissionType = 'timeout';
                    this.submitTest();
                }
            } else if (parsed.viewState === 'submitted') {
                this.viewState = 'submitted';
            }
        } else {
            this.timeLeft = this.taskDetails.timeLimitSeconds;
            this.updateTimerDisplay();
        }
    }

    saveState() {
        if (this.viewState !== 'active') return;

        const statePayload: any = { viewState: this.viewState };

        // 🚨 THE FIX: Only save endTime for timed tasks
        if (this.taskDetails.type !== 'course') {
            statePayload.endTime = this.endTime;
        }

        if (this.taskDetails.type === 'coding') {
            statePayload.codeContent = this.codeContent;
            statePayload.selectedLangId = this.selectedLangId;
        } else if (this.taskDetails.type === 'quiz') {
            statePayload.quizAnswers = this.quizAnswers;
        }

        localStorage.setItem(`task_state_${this.taskId}`, JSON.stringify(statePayload));
    }

    startTest() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.cdr.detectChanges();

        this.taskService.updateTaskStatus(this.taskId, 'in-progress').subscribe({
            next: () => {
                this.isProcessing = false;
                this.viewState = 'active';

                // 🚨 THE FIX: Only start the timer if it is NOT a course
                if (this.taskDetails.type !== 'course') {
                    this.endTime = Date.now() + (this.taskDetails.timeLimitSeconds * 1000);
                    this.startTimer();
                }

                this.saveState();
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isProcessing = false;
                console.error('Failed to start test', err);
                this.cdr.detectChanges();
            }
        });
    }

    private startTimer() {
        this.clearTimer();
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.ngZone.run(() => {
                if (this.endTime) {
                    const now = Date.now();
                    this.timeLeft = Math.floor((this.endTime - now) / 1000);

                    if (this.timeLeft <= 0) {
                        this.timeLeft = 0;
                        this.updateTimerDisplay();
                        this.submissionType = 'timeout';
                        this.submitTest();
                    } else {
                        this.updateTimerDisplay();
                        this.cdr.detectChanges();
                    }
                }
            });
        }, 1000);
    }

    private clearTimer() { if (this.timerInterval) clearInterval(this.timerInterval); }

    private updateTimerDisplay() {
        const m = Math.floor(Math.max(0, this.timeLeft) / 60);
        const s = Math.max(0, this.timeLeft) % 60;
        this.timerDisplay = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // --- 💻 CODING LOGIC ---
    runTests() {
        this.testStatus = 'running';
        this.terminalOutput = 'Compiling and executing code on server...';
        this.cdr.detectChanges();

        this.taskService.runCodeExecution(this.taskId, this.codeContent, this.selectedLangId)
            .subscribe({
                next: (res) => {
                    this.testStatus = res.status;
                    this.terminalOutput = res.output;
                    this.testMetrics = res;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.testStatus = 'failed';
                    this.terminalOutput = 'Server Error: Could not reach execution engine.';
                    console.error(err);
                    this.cdr.detectChanges();
                }
            });
    }

    // --- 📝 QUIZ LOGIC ---
    selectOption(questionIndex: number, option: string) {
        this.quizAnswers[questionIndex] = option;
        this.saveState();
    }

    // Helper checking if a quiz is fully answered before submission
    isQuizComplete(): boolean {
        if (!this.taskDetails.questions) return false;
        return Object.keys(this.quizAnswers).length === this.taskDetails.questions.length;
    }

    // --- 🚀 SUBMIT REACTION PIPELINE ---
    submitTest() {
        if (this.isProcessing || this.viewState === 'submitted') return;

        this.isProcessing = true;
        this.clearTimer();
        this.cdr.detectChanges();

        // Construct payload based on Task Type
        const payload: any = {
            language: this.selectedLangId || 'none'
        };

        if (this.taskDetails.type === 'coding') {
            payload.codePayload = this.codeContent;
        } else if (this.taskDetails.type === 'quiz') {
            payload.codePayload = JSON.stringify(this.quizAnswers); // Store answer selections as a string
        } else if (this.taskDetails.type === 'course') {
            payload.codePayload = "COURSE_COMPLETED_SUCCESSFULLY";
        }

        this.http.post(`${environment.apiUrl}/tasks/attempts/${this.taskId}/submit`, payload)
            .subscribe({
                next: () => {
                    this.isProcessing = false;
                    this.viewState = 'submitted';
                    localStorage.removeItem(`task_state_${this.taskId}`);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.isProcessing = false;
                    console.error('Submit failed', err);
                    this.cdr.detectChanges();
                }
            });
    }
    // 🚨 NEW: Detects file type from the URL to determine the rendering engine
    // 🚨 UPDATED: Automatically repairs Cloudinary paths for non-image files!
    getAttachmentType(): 'image' | 'pdf' | 'document' | 'none' {
        const url = this.taskDetails?.attachmentUrl;
        if (!url) return 'none';

        const cleanUrl = url.toLowerCase();

        if (cleanUrl.endsWith('.pdf')) {
            // 🚨 THE FIX: Removed the URL rewrite hack. We trust the URL as-is now!
            return 'pdf';
        } else if (
            cleanUrl.endsWith('.png') ||
            cleanUrl.endsWith('.jpg') ||
            cleanUrl.endsWith('.jpeg') ||
            cleanUrl.endsWith('.gif') ||
            cleanUrl.endsWith('.webp')
        ) {
            return 'image';
        } else {
            return 'document';
        }
    }

    // 🚨 NEW: Extracts the filename from the long Cloudinary URL for a cleaner UI
    getAttachmentFileName(): string {
        const url = this.taskDetails?.attachmentUrl;
        if (!url) return 'Attachment';
        const parts = url.split('/');
        return decodeURIComponent(parts[parts.length - 1]);
    }

    // 🚨 Add this so your HTML template can safely parse URLs
    encodeURIComponent(url: string): string {
        return encodeURIComponent(url);
    }

    goToTasks() { this.location.back(); }
    goBackToDashboard() { this.location.back(); }
}