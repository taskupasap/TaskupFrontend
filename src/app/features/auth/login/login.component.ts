import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="aurora-bg"></div>
    <div class="auth-container">
      <div class="glass-card login-box fade-in-up">
        
        <div class="brand">
          <span class="icon">🚀</span>
          <h1>TaskUp</h1>
        </div>
        
        <h2>Welcome Back</h2>
        <p class="subtitle">Enter your details to access your workspace.</p>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          
          <div class="input-group">
            <label for="email">Email</label>
            <input 
              id="email" 
              type="email" 
              formControlName="email" 
              placeholder="name@organization.com"
              [class.invalid]="isFieldInvalid('email')"
            >
            <span class="error-text" *ngIf="isFieldInvalid('email')">Please enter a valid email.</span>
          </div>
          
          <div class="input-group">
            <label for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              formControlName="password" 
              placeholder="••••••••"
              [class.invalid]="isFieldInvalid('password')"
            >
            <span class="error-text" *ngIf="isFieldInvalid('password')">Password is required.</span>
          </div>

          <div class="forgot-password">
            <a href="javascript:void(0)" (click)="forgotPassword()">Forgot password?</a>
          </div>

          <div class="error-banner" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-primary full-width" [disabled]="loginForm.invalid || isLoading">
            {{ isLoading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <div class="divider">
          <span>OR</span>
        </div>

        <button class="btn-google full-width" (click)="loginWithGoogle()" [disabled]="isLoading">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo">
          Sign in with Google
        </button>

        <p class="register-link">
          Don't have an account? <a routerLink="/auth/register">Get Started</a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      z-index: 1;
    }

    .login-box {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
      
      .icon { font-size: 32px; }
      h1 { font-size: 28px; color: var(--primary); margin: 0; }
    }

    h2 { text-align: center; margin: 0; font-size: 24px; }
    .subtitle { text-align: center; color: var(--text-muted); margin: -16px 0 0 0; font-size: 14px; }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
      
      input {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--glass-border);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: var(--font-body);
        font-size: 15px;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(0, 0, 0, 0.4);
        }

        &.invalid {
          border-color: var(--danger);
        }
      }

      .error-text {
        color: var(--danger);
        font-size: 12px;
        margin-top: 4px;
      }
    }

    .forgot-password {
      text-align: right;
      a { color: var(--primary); font-size: 13px; text-decoration: none; font-weight: 500; }
      a:hover { text-decoration: underline; }
    }

    .full-width { width: 100%; }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

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
      span { padding: 0 10px; }
    }

    .btn-google {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      color: white;
      padding: 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-weight: 500;
      transition: all 0.2s;

      img { width: 20px; height: 20px; }
      
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      &:disabled { opacity: 0.7; cursor: not-allowed; }
    }

    .register-link {
      text-align: center;
      font-size: 14px;
      color: var(--text-muted);
      margin: 0;
      
      a { color: var(--primary); text-decoration: none; font-weight: 600; }
      a:hover { text-decoration: underline; }
    }

    .error-banner {
      background: rgba(255, 71, 87, 0.1);
      border: 1px solid var(--danger);
      color: #ff6b81;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      text-align: center;
    }

    .fade-in-up {
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  isLoading = false;
  errorMessage = '';

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email, password);
      // Navigation is handled in the auth service
    } catch (error: any) {
      this.errorMessage = 'Invalid email or password. Please try again.';
      console.error('Login error', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await this.authService.loginWithGoogle();
      // Navigation is handled in the auth service based on whether profile exists
    } catch (error: any) {
      this.errorMessage = 'Google sign-in failed. Please try again.';
      console.error('Google login error', error);
    } finally {
      this.isLoading = false;
    }
  }

  forgotPassword() {
    alert('Forgot password flow will be implemented here.');
  }
}