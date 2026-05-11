import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
    selector: 'app-org-type-select',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="aurora-bg"></div>
    <div class="auth-container">
      <div class="header-section fade-in-down">
        <div class="brand">
          <span class="icon">🚀</span>
          <h2>TaskUp</h2>
        </div>
        <h1>Choose your workspace</h1>
        <p class="subtitle">How will you be using TaskUp? We'll tailor the experience for you.</p>
      </div>

      <div class="cards-container">
        
        <!-- Company Card -->
        <div class="type-card glass-card fade-in-up delay-1" (click)="selectOrgType('company')">
          <div class="card-icon company-icon">🏢</div>
          <h3>Company / Org</h3>
          <p>For managers and employees to track work, projects, and daily reports.</p>
          <div class="select-btn">Create Workspace →</div>
        </div>

        <!-- College Card -->
        <div class="type-card glass-card fade-in-up delay-2" (click)="selectOrgType('college')">
          <div class="card-icon college-icon">🎓</div>
          <h3>College / Institute</h3>
          <p>For professors to assign research, coding challenges, and track batches.</p>
          <div class="select-btn">Create Workspace →</div>
        </div>

        <!-- School Card -->
        <div class="type-card glass-card fade-in-up delay-3" (click)="selectOrgType('school')">
          <div class="card-icon school-icon">🏫</div>
          <h3>School</h3>
          <p>For teachers to assign homework, quizzes, and manage class activities.</p>
          <div class="select-btn">Create Workspace →</div>
        </div>

      </div>

      <div class="invite-section fade-in-up delay-4">
        <div class="divider">
          <span>OR</span>
        </div>
        <div class="invite-box glass-card">
          <div class="invite-content">
            <span class="invite-icon">🎟️</span>
            <div>
              <h3>Have an invite code?</h3>
              <p>Join an existing organization as an employee or student.</p>
            </div>
          </div>
          <button class="btn-primary outline" routerLink="/auth/register/member">
            Join via Code →
          </button>
        </div>
        
        <p class="login-link">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    </div>
  `,
    styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      position: relative;
      z-index: 1;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header-section {
      text-align: center;
      margin-bottom: 48px;

      .brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 24px;
        
        .icon { font-size: 24px; }
        h2 { font-size: 20px; color: var(--primary); margin: 0; }
      }

      h1 { font-size: 40px; margin-bottom: 12px; }
      .subtitle { color: var(--text-muted); font-size: 16px; max-width: 500px; margin: 0 auto; }
    }

    .cards-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      width: 100%;
      margin-bottom: 48px;
    }

    .type-card {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 4px;
        background: transparent;
        transition: all 0.3s ease;
      }

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        background: rgba(255, 255, 255, 0.08);

        .select-btn {
          opacity: 1;
          transform: translateY(0);
        }
      }

      &:nth-child(1):hover::before { background: var(--info); }
      &:nth-child(2):hover::before { background: var(--primary); }
      &:nth-child(3):hover::before { background: var(--accent); }

      .card-icon {
        font-size: 48px;
        margin-bottom: 24px;
        height: 80px;
        width: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.05);
      }

      h3 { font-size: 20px; margin-bottom: 12px; }
      p { color: var(--text-muted); font-size: 14px; line-height: 1.5; margin-bottom: 24px; flex-grow: 1; }

      .select-btn {
        color: var(--primary);
        font-weight: 600;
        font-size: 14px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
      }
    }

    .invite-section {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      gap: 32px;

      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        color: var(--text-muted);
        font-size: 12px;
        
        &::before, &::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--glass-border);
        }
        span { padding: 0 16px; font-weight: 600; letter-spacing: 1px; }
      }

      .invite-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 32px;
        gap: 24px;

        .invite-content {
          display: flex;
          align-items: center;
          gap: 16px;

          .invite-icon { font-size: 32px; }
          h3 { margin: 0 0 4px 0; font-size: 18px; }
          p { margin: 0; color: var(--text-muted); font-size: 13px; }
        }

        .btn-primary.outline {
          background: transparent;
          border: 1px solid var(--primary);
          color: var(--primary);
          white-space: nowrap;
          
          &:hover {
            background: rgba(108, 99, 255, 0.1);
          }
        }
      }

      .login-link {
        text-align: center;
        font-size: 14px;
        color: var(--text-muted);
        
        a { color: var(--primary); text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
      }
    }

    /* Animations */
    .fade-in-down { animation: fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    .fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
    
    .delay-1 { animation-delay: 0.1s; }
    .delay-2 { animation-delay: 0.2s; }
    .delay-3 { animation-delay: 0.3s; }
    .delay-4 { animation-delay: 0.5s; }

    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Mobile Responsive */
    @media (max-width: 850px) {
      .cards-container {
        grid-template-columns: 1fr;
        max-width: 400px;
      }
      .invite-box {
        flex-direction: column;
        text-align: center;
        
        .invite-content { flex-direction: column; text-align: center; }
        button { width: 100%; }
      }
    }
  `]
})
export class OrgTypeSelectComponent {
    private router = inject(Router);

    selectOrgType(type: 'company' | 'college' | 'school') {
        // Navigate to Admin Registration and pass the selected org type as a query parameter
        this.router.navigate(['/auth/register/admin'], { queryParams: { type } });
    }
}