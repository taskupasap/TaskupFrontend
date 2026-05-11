import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment.development';
import { LeaderboardUser } from '@core/models';

@Component({
    selector: 'app-leaderboard',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="leaderboard-container fade-in">
      <div class="header">
        <h1>🏆 Workspace Leaderboard</h1>
        <p>Complete tasks to earn XP and climb the ranks!</p>
      </div>

      @if (isLoading) {
        <div class="loading">Loading top performers...</div>
      } @else {
        <div class="glass-card table-container">
          <div class="table-header">
            <span class="col-rank">Rank</span>
            <span class="col-user">Team Member</span>
            <span class="col-level">Level</span>
            <span class="col-xp">Total XP</span>
          </div>

          <div class="table-body">
            @for (user of users; track user.id; let i = $index) {
              <div class="table-row" [class.current-user]="user.id === currentUserId">
                
                <!-- Rank with Medals for Top 3 -->
                <span class="col-rank">
                  @if (i === 0) { <span class="medal gold">🥇</span> }
                  @else if (i === 1) { <span class="medal silver">🥈</span> }
                  @else if (i === 2) { <span class="medal bronze">🥉</span> }
                  @else { <span class="number">#{{ i + 1 }}</span> }
                </span>

                <!-- User Info -->
                <span class="col-user">
                  <div class="avatar">{{ user.displayName.charAt(0).toUpperCase() }}</div>
                  <div class="user-details">
                    <span class="name">{{ user.displayName }}</span>
                    <span class="role">{{ user.role | uppercase }}</span>
                  </div>
                </span>

                <!-- Level & XP -->
                <span class="col-level">
                  <div class="level-badge">Lvl {{ user.level }}</div>
                </span>
                
                <span class="col-xp">{{ user.xp | number }} XP</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .leaderboard-container { padding: 32px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 32px; margin: 0 0 8px 0; background: linear-gradient(90deg, #F9CA24, #f0932b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header p { color: var(--text-muted); }
    
    .table-container { padding: 0; overflow: hidden; }
    .table-header { display: flex; padding: 16px 24px; background: rgba(0,0,0,0.3); font-weight: 600; color: var(--text-muted); font-size: 14px; border-bottom: 1px solid var(--glass-border); }
    
    .table-row { display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; }
    .table-row:hover { background: rgba(255,255,255,0.05); }
    .table-row.current-user { background: rgba(108, 99, 255, 0.1); border-left: 4px solid var(--primary); }
    
    .col-rank { width: 80px; font-size: 24px; text-align: center; }
    .col-rank .number { font-size: 16px; font-weight: 600; color: var(--text-muted); }
    
    .col-user { flex: 1; display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
    .user-details { display: flex; flex-direction: column; }
    .user-details .name { font-weight: 600; font-size: 15px; }
    .user-details .role { font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px; }
    
    .col-level { width: 100px; }
    .level-badge { background: rgba(249, 202, 36, 0.2); color: var(--warning); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; border: 1px solid var(--warning); }
    
    .col-xp { width: 120px; text-align: right; font-weight: 700; color: var(--accent); font-family: monospace; font-size: 16px; }
    .loading { text-align: center; padding: 40px; color: var(--text-muted); }
  `]
})
export class LeaderboardComponent implements OnInit {
    private http = inject(HttpClient);
    public auth = inject(AuthService); // Made public for safety
    private cdr = inject(ChangeDetectorRef); // The Sledgehammer

    users: LeaderboardUser[] = [];
    isLoading = true;
    currentUserId = '';

    ngOnInit() {
        this.auth.currentUser$.subscribe(user => {
            if (user && user.orgId) {
                this.currentUserId = user.uid;
                this.fetchLeaderboard(user.orgId);
            }
        });
    }

    fetchLeaderboard(orgId: string) {
        this.http.get<LeaderboardUser[]>(`${environment.apiUrl}/users/org/${orgId}/leaderboard`)
            .subscribe({
                next: (data) => {
                    console.log('Leaderboard Data:', data); // Check your browser console!
                    this.users = data;
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Force the UI to draw right now
                },
                error: (err) => {
                    console.error('Failed to load leaderboard', err);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
    }
}