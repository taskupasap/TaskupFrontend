import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { XpRingComponent } from './widgets/xp-ring.component';
import { User, LeaderboardUser } from '../../core/models';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { FormsModule } from '@angular/forms';
import { TaskService } from '@core/services/task.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, XpRingComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private taskService = inject(TaskService);
  public currentUser$: Observable<User | null> = this.authService.currentUser$;

  // State Variables
  inviteCode = '';
  orgName = '';
  topPerformers: LeaderboardUser[] = [];
  allMembers: LeaderboardUser[] = []; // Used for the modal list
  isRegenerating = false; // New state for animation

  isLoadingLeaders = true;
  showMemberModal = false;

  // Dynamic Terminology
  get taskLabel(): string {
    const orgType = this.authService.currentUser?.orgType || 'company';
    switch (orgType) {
      case 'school': return 'Assignment';
      case 'college': return 'Task';
      case 'company': return 'Course';
      default: return 'Task';
    }
  }

  ngOnInit() {
    this.currentUser$.subscribe(user => {
      if (user && user.orgId) {
        this.fetchTopPerformers(user.orgId);

        if (user.role === 'admin') {
          this.fetchInviteInfo(user.orgId);
        }
      }
    });
  }

  fetchInviteInfo(orgId: string) {
    // Note: Removed /api/ since it's in your environment base URL
    this.http.get<{ inviteCode: string, orgName: string }>(`${environment.apiUrl}/invite/${orgId}`)
      .subscribe(res => {
        this.inviteCode = res.inviteCode;
        this.orgName = res.orgName;
        this.cdr.detectChanges();
      });
  }

  fetchTopPerformers(orgId: string) {
    this.http.get<LeaderboardUser[]>(`${environment.apiUrl}/users/org/${orgId}/leaderboard`)
      .subscribe(members => {

        // Fetch ALL tasks for the organization
        this.taskService.getTasks(orgId).subscribe(tasks => {

          this.allMembers = members.map(member => {
            const pendingCount = tasks.filter(t => {
              // 1. Safety check if assignedTo exists
              if (!t.assignedTo) return false;

              // 2. Check if assigned
              const isAssigned = Array.isArray(t.assignedTo)
                ? t.assignedTo.includes(member.id)
                : t.assignedTo === member.id;

              // 3. 🚨 Handle C# PascalCase vs Angular camelCase
              const taskStatus = (t.status || (t as any).Status || '').toLowerCase();

              return isAssigned && taskStatus === 'review';
            }).length;

            return { ...member, pendingReviews: pendingCount };
          });

          this.topPerformers = [...this.allMembers].sort((a, b) => b.xp - a.xp).slice(0, 3);
          this.isLoadingLeaders = false;
          this.cdr.detectChanges();
        });

      });
  }

  regenerateCode(orgId: string) {
    this.isRegenerating = true;
    this.http.post<{ newCode: string }>(`${environment.apiUrl}/invite/${orgId}/regenerate`, {})
      .subscribe({
        next: (res) => {
          this.inviteCode = res.newCode;
          setTimeout(() => {
            this.isRegenerating = false;
            this.cdr.detectChanges();
          }, 600);
        },
        error: () => this.isRegenerating = false
      });
  }

  openMemberProfile(member: LeaderboardUser) {
    this.router.navigate(['/member', member.id]);
  }

  updateMemberRole(memberId: string, newRole: string) {
    // Optimistic UI update
    const member = this.allMembers.find(m => m.id === memberId);
    if (member) member.role = newRole;

    this.http.put(`${environment.apiUrl}/users/${memberId}/role`, { role: newRole })
      .subscribe({
        error: (err) => console.error('Failed to update role', err)
      });
  }

  removeMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    // Optimistic UI update
    this.allMembers = this.allMembers.filter(m => m.id !== memberId);

    this.http.delete(`${environment.apiUrl}/users/org/${this.orgName}/remove/${memberId}`)
      .subscribe({
        error: (err) => console.error('Failed to remove member', err)
      });
  }
}