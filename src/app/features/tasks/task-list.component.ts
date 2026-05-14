import { Component, inject, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { LeaderboardUser, Task } from '../../core/models';
import confetti from 'canvas-confetti';
import { environment } from '@env/environment.development';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TerminologyPipe } from '../../core/pipes/terminology.pipe'; // Adjust path if needed
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, ReactiveFormsModule, FormsModule, TerminologyPipe],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  public auth = inject(AuthService);
  private ngZone = inject(NgZone);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  allMembers: LeaderboardUser[] = [];
  // columns = [
  //   { label: 'To Do', status: 'todo', tasks: [] as Task[] },
  //   { label: 'In Progress', status: 'in-progress', tasks: [] as Task[] },
  //   { label: 'Review', status: 'review', tasks: [] as Task[] },
  //   { label: 'Completed', status: 'completed', tasks: [] as Task[] }
  // ];
  columns: { label: string; status: string; tasks: Task[] }[] = [];


  taskForm: FormGroup = this.fb.group({
    type: ['coding', Validators.required], // 🚨 Default Type
    title: ['', Validators.required],
    priority: ['medium'],
    xpReward: [50, Validators.required],
    assignedTo: [''],
    timeLimit: [30],
    xpPerQuestion: [10, Validators.required], // 🚨 Changed from xpReward to xpPerQuestion

    // Type specific fields
    description: [''],
    startingCode: [''],
    readContent: [''], // For courses
    questions: this.fb.array([]) // 🚨 Dynamic Array for quiz questions
  });

  isCreating = false;
  orgId = '';
  // 🚨 NEW CLOUDINARY VARIABLES
  selectedFile: File | null = null;
  selectedFileName = '';
  isUploading = false;


  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      if (user && user.orgId) {
        this.orgId = user.orgId;
        this.loadTasks(user);
        this.loadMembers(user.orgId);
      }
    });
  }
  // Getters to easily interact with our FormArray in the template
  get questions(): FormArray {
    return this.taskForm.get('questions') as FormArray;
  }
  // Helper to add a new question to the Quiz
  addQuestion() {
    const questionGroup = this.fb.group({
      questionText: ['', Validators.required],
      options: this.fb.array([
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required)
      ]),
      correctOptionIndex: [0, Validators.required] // 🚨 Tracks which option is correct
    });
    this.questions.push(questionGroup);
    this.cdr.detectChanges();
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
    this.cdr.detectChanges();
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addOption(questionIndex: number) {
    this.getOptions(questionIndex).push(this.fb.control('', Validators.required));
    this.cdr.detectChanges();
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.getOptions(questionIndex).removeAt(optionIndex);
    this.cdr.detectChanges();
  }

  // Helper to dynamically switch validation rules when the Admin toggles types
  onTypeChange() {
    const type = this.taskForm.get('type')?.value;

    // Clean up dynamic arrays when switching types
    if (type !== 'quiz') {
      this.questions.clear();
    }
    this.cdr.detectChanges();
  }
  get taskLabel(): string {
    const orgType = this.auth.currentUser?.orgType || 'company';
    switch (orgType) {
      case 'school': return 'Assignment';
      case 'college': return 'Task';
      case 'company': return 'Course';
      default: return 'Task';
    }
  }

  loadMembers(orgId: string) {
    this.http.get<LeaderboardUser[]>(`${environment.apiUrl}/users/org/${orgId}/leaderboard`)
      .subscribe((data: LeaderboardUser[]) => {
        this.allMembers = data;
      });
  }

  // 1. Remove the hardcoded 4 columns and start empty so it builds dynamically

  loadTasks(user: any) {
    const orgId = user.orgId;

    // 1. Determine the terminology safely
    const isSchool = (localStorage.getItem('workspaceType') || '').toLowerCase() === 'school';

    // 2. Clear columns while loading so the UI doesn't crash on undefined variables
    this.columns = [];

    this.taskService.getTasks(orgId).subscribe({
      next: (tasks) => {
        this.ngZone.run(() => {
          const isAdmin = user.role === 'admin';
          const myId = user.uid || user.id;

          let visibleTasks = tasks;

          if (isAdmin) {
            // 🚨 THE FIX: These are calculated inside the subscribe now!
            const masterTasks = visibleTasks.filter(t => !t.pendingReviewCount || Number(t.pendingReviewCount) === 0);
            const pendingTasks = visibleTasks.filter(t => t.pendingReviewCount && Number(t.pendingReviewCount) > 0);

            // Log the pending tasks so you can see them in your F12 Chrome console!
            console.log("Total Tasks Found with Pending Reviews:", pendingTasks.length);

            // 3. Build the Admin columns using the terminology logic
            this.columns = [
              { label: isSchool ? '📋 Master Assignments' : '📋 Master Tasks', status: 'master', tasks: masterTasks },
              { label: '🔴 Pending Reviews', status: 'review', tasks: pendingTasks }
            ];
          } else {
            // 🎓 Student gets the standard 4 Kanban columns
            visibleTasks = tasks.filter(t => {
              if (!t.assignedTo) return false;
              return Array.isArray(t.assignedTo)
                ? t.assignedTo.includes(myId)
                : t.assignedTo === myId;
            });

            this.columns = [
              { label: 'To Do', status: 'todo', tasks: [] },
              { label: 'In Progress', status: 'in-progress', tasks: [] },
              { label: 'Review', status: 'review', tasks: [] },
              { label: 'Completed', status: 'completed', tasks: [] }
            ];

            this.columns = this.columns.map(col => ({
              ...col,
              tasks: visibleTasks.filter(t => {
                const taskStatus = (t.status || (t as any).Status || '').toLowerCase();
                return taskStatus === col.status.toLowerCase();
              })
            }));
          }

          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('API Error:', err)
    });
  }

  // 🚨 NEW: Capture the file when selected
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
    }
  }

  // 🚨 OVERHAULED: Create Task with Optional Upload
  createTask(orgId: string) {
    if (this.taskForm.invalid) return;

    this.isCreating = true;
    this.cdr.detectChanges();

    // 1. Is there a file?
    if (this.selectedFile) {
      this.isUploading = true;
      this.taskService.uploadAsset(this.selectedFile).subscribe({
        next: (res: any) => {
          this.isUploading = false;
          // Upload success! Create the task with the URL
          this.finalizeTaskCreation(orgId, res.url);
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.isUploading = false;
          this.isCreating = false;
          alert('Failed to upload file. Please try again.');
          this.cdr.detectChanges();
        }
      });
    } else {
      // 2. Optional: No file selected, create task immediately
      this.finalizeTaskCreation(orgId, null);
    }
  }

  private finalizeTaskCreation(orgId: string, attachmentUrl: string | null) {
    const formVals = this.taskForm.value;
    const assignedArray = formVals.assignedTo
      ? (Array.isArray(formVals.assignedTo) ? formVals.assignedTo : [formVals.assignedTo])
      : [];

    const baseTask: Partial<any> = {
      title: formVals.title,
      priority: formVals.priority,
      status: 'todo',
      orgId: orgId,
      type: formVals.type,
      timeLimitSeconds: (formVals.timeLimit || 30) * 60,
      description: formVals.description,

      // Pack specific fields based on task type
      startingCode: formVals.type === 'coding' ? formVals.startingCode : null,
      readContent: formVals.type === 'course' ? formVals.readContent : null,
      attachmentUrl: (formVals.type === 'coding' || formVals.type === 'course') ? (attachmentUrl || null) : null,
      // Pack specific fields based on task type
      questions: formVals.type === 'quiz' ? formVals.questions.map((q: any) => ({
        questionText: q.questionText,
        options: q.options,
        // 🚨 Map the selected index to the actual text string to send to the backend
        correctAnswer: q.options[q.correctOptionIndex]
      })) : [],

      xpPerQuestion: formVals.type === 'quiz' ? formVals.xpPerQuestion : null,
      // Calculate total XP for display purposes
      xpReward: formVals.type === 'quiz' ? (formVals.questions.length * formVals.xpPerQuestion) : formVals.xpReward
    };

    if (assignedArray.length === 0) {
      this.saveSingleTask({ ...baseTask, assignedTo: [] }, orgId);
      return;
    }

    const creationObservables = assignedArray.map((userId: string) => {
      return this.taskService.createTask({ ...baseTask, assignedTo: [userId] });
    });

    forkJoin(creationObservables).subscribe({
      next: () => this.resetCreationForm(orgId),
      error: (err) => {
        console.error('Failed to assign tasks', err);
        this.isCreating = false;
        this.cdr.detectChanges();
      }
    });
  }

  private resetCreationForm(orgId: string) {
    this.isCreating = false;
    this.selectedFile = null;
    this.selectedFileName = '';
    this.questions.clear(); // Reset quiz array

    this.taskForm.reset({
      type: 'coding',
      title: '',
      priority: 'medium',
      xpReward: 50,
      assignedTo: '',
      timeLimit: 30
    });

    this.auth.currentUser$.subscribe(u => {
      if (u) this.loadTasks(u);
    }).unsubscribe();
    this.cdr.detectChanges();
  }

  private saveSingleTask(task: Partial<Task>, orgId: string) {
    this.taskService.createTask(task).subscribe({
      next: () => this.resetCreationForm(orgId)
    });
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      this.taskService.updateTaskStatus(task.id, newStatus).subscribe();

      if (newStatus === 'completed') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#6C63FF', '#43E97B', '#F9CA24'] });
      }
    }
  }

  // --- MODAL PROPERTIES ---
  selectedTask: Task | null = null;
  isSaving = false;
  modalError = '';
  showModal: boolean = false;

  editForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['medium']
  });

  openTask(task: any) {
    const isAdmin = this.auth.currentUser?.role === 'admin';

    if (isAdmin && task.status === 'review') {
      const confirmApprove = confirm(`Approve "${task.title}" and grant ${task.xpReward} XP?`);
      if (confirmApprove) {
        this.approveTask(task);
      }
      return;
    }

    if (isAdmin) {
      this.selectedTask = { ...task };
      this.editForm.patchValue(task);
      this.showModal = true;
      return;
    }

    if (!isAdmin && (task.status === 'todo' || task.status === 'in-progress')) {
      this.router.navigate(['/task', task.id, 'execute']);
      return;
    }

    if (!isAdmin && (task.status === 'review' || task.status === 'completed')) {
      alert('This task is locked and cannot be altered.');
    }
  }

  approveTask(task: any) {
    // 1. Safely extract the student ID (handling both arrays and single strings)
    const studentId = Array.isArray(task.assignedTo) && task.assignedTo.length > 0
      ? task.assignedTo[0]
      : task.assignedTo;

    if (!studentId) {
      alert('Error: Cannot approve this task because no user is assigned to it.');
      return;
    }

    // 2. Pass the studentId as the required 3rd argument!
    this.taskService.approveTaskAttempt(task.id, task.xpReward, studentId).subscribe({
      next: () => {
        alert(`Success! ${task.xpReward} XP granted.`);

        // Refresh the tasks to update the UI
        this.auth.currentUser$.subscribe(user => {
          if (user && user.orgId) {
            this.loadTasks(user);
          }
        }).unsubscribe();
      },
      error: (err) => {
        console.error('Approval failed', err);
        alert('Server Error: Could not approve task.');
      }
    });
  }

  closeModal() {
    this.selectedTask = null;
    this.modalError = '';
  }

  saveTaskDetails() {
    if (this.editForm.invalid || !this.selectedTask) return;

    this.isSaving = true;
    this.modalError = '';
    const updates = this.editForm.value;

    this.taskService.updateTaskDetails(this.selectedTask.id, updates).subscribe({
      next: () => {
        if (this.selectedTask) {
          this.selectedTask.title = updates.title;
          this.selectedTask.description = updates.description;
          this.selectedTask.priority = updates.priority;
        }

        this.isSaving = false;
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to update task', err);
        this.modalError = 'Error saving changes. Please try again.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteTask() {
    if (!this.selectedTask) return;

    const idToDelete = this.selectedTask.id;

    this.columns.forEach(col => {
      col.tasks = col.tasks.filter(t => t.id !== idToDelete);
    });

    this.closeModal();

    this.taskService.deleteTask(idToDelete).subscribe({
      error: (err) => console.error('Failed to delete task', err)
    });
  }

  getMemberNames(userIds: string | string[] | undefined): string {
    if (!userIds) return 'Unassigned';

    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return 'Unassigned';

    return ids
      .map(id => this.allMembers.find(m => m.id === id)?.displayName || 'Unknown')
      .join(', ');
  }

  ensureArray(userIds: string | string[] | undefined): string[] {
    if (!userIds) return [];
    return Array.isArray(userIds) ? userIds : [userIds];
  }

  getInitial(userId: string): string {
    const member = this.allMembers.find(m => m.id === userId);
    return member ? member.displayName.charAt(0).toUpperCase() : '?';
  }
  // 🚨 NEW: Intercepts radio clicks to allow deselecting
  // 🚨 UPDATED: Handles both selecting and deselecting manually, bypassing Angular's strict radio limits
  toggleCorrectOption(qIdx: number, optIdx: number, event: MouseEvent) {
    const control = this.questions.at(qIdx).get('correctOptionIndex');

    if (control?.value === optIdx) {
      // It was already checked, so clear it
      event.preventDefault();
      control.setValue(null);
    } else {
      // It was empty, so set it to the new choice
      control?.setValue(optIdx);
    }
  }

  // --- Quick Assign Modal Variables ---
  showAssignModal = false;
  taskToAssign: any = null;
  selectedAssignees: string[] = []; // Handles multiple people
  isAssigning = false;

  // Opens the modal and pre-fills current assignments
  openAssignModal(task: any) {
    this.taskToAssign = task;
    // Ensure it's an array for the multiple select dropdown
    this.selectedAssignees = task.assignedTo
      ? (Array.isArray(task.assignedTo) ? [...task.assignedTo] : [task.assignedTo])
      : [];
    this.showAssignModal = true;
    this.cdr.detectChanges();
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.taskToAssign = null;
    this.cdr.detectChanges();
  }

  saveAssignment() {
    if (!this.taskToAssign) return;
    this.isAssigning = true;

    this.taskService.updateTaskAssignment(this.taskToAssign.id, this.selectedAssignees).subscribe({
      next: () => {
        // Update the local UI instantly
        this.taskToAssign.assignedTo = this.selectedAssignees;
        this.isAssigning = false;
        this.closeAssignModal();
      },
      error: (err) => {
        console.error('Failed to assign task', err);
        this.isAssigning = false;
        alert('Server Error: Could not update assignments.');
        this.cdr.detectChanges();
      }
    });
  }

}