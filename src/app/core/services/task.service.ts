import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Task } from '../models';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/tasks`;

    // 🚨 THE FIX: Added optional userId parameter
    getTasks(orgId: string, userId?: string): Observable<any[]> {
        let url = `${environment.apiUrl}/tasks/${orgId}`;
        if (userId) {
            url += `?userId=${userId}`;
        }
        return this.http.get<any[]>(url);
    }

    updateTaskStatus(taskId: string, status: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${taskId}/status`, `"${status}"`, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    createTask(task: Partial<Task>): Observable<any> {
        return this.http.post(this.apiUrl, task);
    }

    // Add { responseType: 'text' } to the end!
    updateTaskDetails(id: string, updates: Partial<Task>): Observable<any> {
        return this.http.put(`${environment.apiUrl}/tasks/${id}`, updates, { responseType: 'text' });
    }

    deleteTask(id: string): Observable<any> {
        return this.http.delete(`${environment.apiUrl}/tasks/${id}`);
    }

    // --- NEW LMS ENDPOINTS ---

    // 1. Approve a task and grant XP (Admin only)
    // 🚨 Add studentId parameter and payload
    approveTaskAttempt(attemptId: string, xpReward: number, studentId: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/tasks/attempts/${attemptId}/approve`, { xpReward, studentId });
    }

    // 2. Optional: Fetch tasks awaiting review (For Admin dashboard)
    getTasksPendingReview(orgId: string): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/tasks/org/${orgId}/review`);
    }

    // Send code to the backend to be evaluated
    runCodeExecution(attemptId: string, code: string, compilerId: string): Observable<any> {
        const payload = {
            code: code,
            compilerId: compilerId
        };
        return this.http.post(`${environment.apiUrl}/tasks/attempts/${attemptId}/run`, payload);
    }

    // 🚨 NEW: Upload file to C# backend
    uploadAsset(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file); // 🚨 This key 'file' must match the C# 'IFormFile file' parameter

        // Ensure environment.apiUrl includes the /api prefix if your backend uses it
        return this.http.post<{ url: string }>(`${environment.apiUrl}/upload`, formData);
    }
    evaluateQuiz(attemptId: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/tasks/attempts/${attemptId}/evaluate-quiz`, {});
    }
    // 🚨 NEW: Quick Assign Endpoint
    updateTaskAssignment(taskId: string, assignedTo: string[]): Observable<any> {
        return this.http.patch(`${environment.apiUrl}/tasks/${taskId}/assign`, assignedTo);
    }
    // 🚨 THE FIX: Match the new C# route
    getTaskById(taskId: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/tasks/detail/${taskId}`);
    }
    getSupportedLanguages(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/tasks/languages`);
    }

}