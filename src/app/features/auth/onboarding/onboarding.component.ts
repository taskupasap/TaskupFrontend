import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
    selector: 'app-onboarding',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="aurora-bg"></div>
    <div class="auth-container">
      <div class="glass-card wizard-box">
        
        <!-- Progress Dots -->
        <div class="progress-indicator">
          <div class="dot" [class.active]="step >= 1" [class.completed]="step > 1"></div>
          <div class="line" [class.completed]="step > 1"></div>
          <div class="dot" [class.active]="step >= 2" [class.completed]="step > 2"></div>
          <div class="line" [class.completed]="step > 2"></div>
          <div class="dot" [class.active]="step >= 3"></div>
        </div>

        <div class="wizard-content" [ngSwitch]="step">
          
          <!-- STEP 1: Profile -->
          <div *ngSwitchCase="1" class="step-slide fade-in">
            <h2>Welcome to TaskUp! 🎉</h2>
            <p class="subtitle">Let's put a face to the name.</p>
            
            <div class="avatar-upload">
              <div class="avatar-circle">
                <span class="placeholder">{{ getInitials() }}</span>
              </div>
              <button class="btn-outline" (click)="mockUpload()">Upload Photo</button>
              <p class="micro-text">Avatar uploads powered by Cloudinary (Phase 7)</p>
            </div>
          </div>

          <!-- STEP 2: Notifications -->
          <div *ngSwitchCase="2" class="step-slide fade-in">
            <h2>Stay in the loop 🔔</h2>
            <p class="subtitle">How would you like us to notify you about tasks and deadlines?</p>
            
            <div class="toggle-list">
              <div class="toggle-item" (click)="prefs.inApp = !prefs.inApp">
                <div class="info">
                  <h4>In-App Notifications</h4>
                  <p>Updates within the TaskUp platform</p>
                </div>
                <div class="switch" [class.on]="prefs.inApp">
                  <div class="knob"></div>
                </div>
              </div>
              
              <div class="toggle-item" (click)="prefs.email = !prefs.email">
                <div class="info">
                  <h4>Email Notifications</h4>
                  <p>Task assignments and reviews</p>
                </div>
                <div class="switch" [class.on]="prefs.email">
                  <div class="knob"></div>
                </div>
              </div>

              <div class="toggle-item" (click)="prefs.deadlineReminder = !prefs.deadlineReminder">
                <div class="info">
                  <h4>Deadline Reminders</h4>
                  <p>Emails 24h and 1h before a task is due</p>
                </div>
                <div class="switch" [class.on]="prefs.deadlineReminder">
                  <div class="knob"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: Gamification Tour -->
          <div *ngSwitchCase="3" class="step-slide fade-in">
            <h2>Level up your work 🚀</h2>
            <p class="subtitle">TaskUp isn't just a to-do list. It's a game.</p>
            
            <div class="tour-grid">
              <div class="tour-card">
                <span class="icon">⭐</span>
                <h4>Earn XP</h4>
                <p>Complete tasks to earn XP and level up your profile.</p>
              </div>
              <div class="tour-card">
                <span class="icon">🔥</span>
                <h4>Build Streaks</h4>
                <p>Log in daily to build your active streak.</p>
              </div>
              <div class="tour-card">
                <span class="icon">🏆</span>
                <h4>Leaderboard</h4>
                <p>Compete with your peers for the top spot.</p>
              </div>
              <div class="tour-card">
                <span class="icon">🎖️</span>
                <h4>Collect Badges</h4>
                <p>Unlock achievements for exceptional performance.</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Navigation Footer -->
        <div class="wizard-footer">
          <button class="btn-text" (click)="skipToDashboard()">Skip for now</button>
          
          <div class="actions">
            <button class="btn-outline" *ngIf="step > 1" (click)="step = step - 1">Back</button>
            <button class="btn-primary" *ngIf="step < 3" (click)="step = step + 1">Continue</button>
            <button class="btn-primary" *ngIf="step === 3" (click)="finishOnboarding()">Go to Dashboard</button>
          </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; z-index: 1; }
    .wizard-box { width: 100%; max-width: 600px; padding: 40px; display: flex; flex-direction: column; min-height: 500px; }
    
    .progress-indicator { display: flex; align-items: center; justify-content: center; margin-bottom: 40px; gap: 8px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); transition: all 0.3s; border: 2px solid transparent; }
    .dot.active { background: var(--primary); border-color: rgba(108, 99, 255, 0.4); box-shadow: 0 0 10px var(--primary); }
    .dot.completed { background: var(--accent); }
    .line { height: 2px; width: 60px; background: rgba(255, 255, 255, 0.1); transition: all 0.3s; }
    .line.completed { background: var(--accent); }

    .wizard-content { flex: 1; display: flex; flex-direction: column; }
    .step-slide { display: flex; flex-direction: column; align-items: center; text-align: center; }
    h2 { font-size: 32px; margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 16px; margin-bottom: 32px; }

    /* Step 1 */
    .avatar-upload { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .avatar-circle { width: 120px; height: 120px; border-radius: 50%; background: rgba(108, 99, 255, 0.2); border: 2px dashed var(--primary); display: flex; align-items: center; justify-content: center; font-size: 40px; color: var(--primary); font-weight: bold; }
    .micro-text { font-size: 11px; color: var(--text-muted); }

    /* Step 2 */
    .toggle-list { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 16px; }
    .toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .toggle-item:hover { background: rgba(255, 255, 255, 0.08); }
    .info { text-align: left; }
    .info h4 { margin: 0 0 4px 0; font-size: 15px; }
    .info p { margin: 0; font-size: 12px; color: var(--text-muted); }
    .switch { width: 44px; height: 24px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; position: relative; transition: all 0.3s; }
    .switch.on { background: var(--accent); }
    .knob { width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .switch.on .knob { transform: translateX(20px); }

    /* Step 3 */
    .tour-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
    .tour-card { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); padding: 20px; border-radius: 12px; text-align: left; transition: all 0.3s; }
    .tour-card:hover { transform: translateY(-4px); background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
    .tour-card .icon { font-size: 24px; margin-bottom: 12px; display: block; }
    .tour-card h4 { margin: 0 0 8px 0; font-size: 16px; }
    .tour-card p { margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.4; }

    /* Footer */
    .wizard-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--glass-border); }
    .actions { display: flex; gap: 12px; }
    .btn-text { background: none; color: var(--text-muted); padding: 8px 16px; }
    .btn-text:hover { color: white; }
    .btn-outline { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 10px 20px; border-radius: 8px; }
    .btn-outline:hover { background: rgba(255, 255, 255, 0.1); }

    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 600px) {
      .tour-grid { grid-template-columns: 1fr; }
      .wizard-footer { flex-direction: column-reverse; gap: 20px; }
    }
  `]
})
export class OnboardingComponent implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);
    private firestore = inject(Firestore);

    step = 1;
    userName = 'User';
    userId = '';

    prefs = {
        inApp: true,
        email: true,
        deadlineReminder: true
    };

    ngOnInit() {
        // Grab the current user's info for the UI
        const user = this.authService.currentUser;
        if (user) {
            this.userName = user.displayName;
            this.userId = user.uid;
        }
    }

    getInitials(): string {
        if (!this.userName) return 'U';
        return this.userName.charAt(0).toUpperCase();
    }

    mockUpload() {
        alert('Avatar file upload will be connected to Cloudinary in Phase 7! For now, we will use your initials.');
    }

    skipToDashboard() {
        this.router.navigate(['/dashboard']);
    }

    async finishOnboarding() {
        try {
            if (this.userId) {
                // Save the notification preferences to Firestore
                const userRef = doc(this.firestore, `users/${this.userId}`);
                await updateDoc(userRef, {
                    notificationPrefs: this.prefs
                });
            }
            this.router.navigate(['/dashboard']);
        } catch (error) {
            console.error('Error saving preferences', error);
            this.router.navigate(['/dashboard']);
        }
    }
}