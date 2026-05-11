import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InviteService } from '../../../../core/services/invite.service';
import { Organization } from '../../../../core/models';

// Custom validator to check if passwords match
export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-member-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="aurora-bg"></div>
    <div class="auth-container">
      <div class="glass-card register-box fade-in-up">
        
        <button class="back-btn" routerLink="/auth/register">← Back</button>

        <div class="header">
          <div class="icon-badge">🎟️</div>
          <h2>Join Workspace</h2>
          <p class="subtitle">Enter your invite code to join your organization.</p>
        </div>
        
        <!-- Step 1: Invite Code Verification -->
        <div class="code-verification" *ngIf="!verifiedOrg">
          <div class="input-group">
            <label for="inviteCode">Invite Code</label>
            <div class="code-input-row">
              <input 
                id="inviteCode" 
                type="text" 
                [formControl]="codeControl" 
                placeholder="6-Digit Code (e.g. TU7X2K)"
                maxlength="6"
                (input)="forceUppercase($event)"
              >
              <button class="btn-primary" (click)="verifyCode()" [disabled]="codeControl.invalid || isVerifying">
                {{ isVerifying ? 'Checking...' : 'Verify' }}
              </button>
            </div>
            <span class="error-text" *ngIf="codeError">{{ codeError }}</span>
          </div>
        </div>

        <!-- Step 2: Member Details (Revealed after valid code) -->
        <div *ngIf="verifiedOrg" class="fade-in-down">
          
          <div class="success-banner">
            <span class="icon">✅</span>
            <div class="text">
              <strong>Joining Organization:</strong><br>
              {{ verifiedOrg.name }} ({{ verifiedOrg.type | titlecase }})
            </div>
            <button class="change-code-btn" (click)="resetCode()">Change</button>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            
            <div class="input-group">
              <label for="displayName">Your Full Name</label>
              <input id="displayName" type="text" formControlName="displayName" placeholder="Jane Doe">
              <span class="error-text" *ngIf="isFieldInvalid('displayName')">Your name is required.</span>
            </div>

            <!-- Dynamic ID Field based on Org Type -->
            <div class="input-group">
              <label for="memberId">{{ idFieldLabel }}</label>
              <input id="memberId" type="text" formControlName="memberId" [placeholder]="'Enter your ' + idFieldLabel">
              <span class="error-text" *ngIf="isFieldInvalid('memberId')">{{ idFieldLabel }} is required.</span>
            </div>
            
            <div class="input-group">
              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" placeholder="jane@example.com">
              <span class="error-text" *ngIf="isFieldInvalid('email')">Please enter a valid email.</span>
            </div>
            
            <div class="row">
              <div class="input-group">
                <label for="password">Password</label>
                <input id="password" type="password" formControlName="password" placeholder="••••••••">
              </div>
              <div class="input-group">
                <label for="confirmPassword">Confirm</label>
                <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="••••••••">
              </div>
            </div>
            <span class="error-text" *ngIf="isFieldInvalid('password')">Password must be at least 6 characters.</span>
            <span class="error-text" *ngIf="registerForm.errors?.['passwordsMismatch'] && (registerForm.touched || registerForm.dirty)">
              Passwords do not match.
            </span>

            <div class="error-banner" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <button type="submit" class="btn-primary full-width" [disabled]="registerForm.invalid || isLoading">
              {{ isLoading ? 'Creating Account...' : 'Join Workspace' }}
            </button>
          </form>
        </div>

        <p class="login-link">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; z-index: 1; }
    .register-box { width: 100%; max-width: 480px; padding: 40px; position: relative; }
    .back-btn { position: absolute; top: 24px; left: 24px; background: transparent; color: var(--text-muted); font-size: 14px; padding: 4px 8px; &:hover { color: white; transform: translateX(-2px); } }

    .header { text-align: center; margin-bottom: 32px; margin-top: 16px;
      .icon-badge { font-size: 40px; margin-bottom: 16px; }
      h2 { font-size: 28px; margin: 0 0 8px 0; }
      .subtitle { color: var(--text-muted); font-size: 14px; margin: 0; }
    }

    .code-input-row {
      display: flex; gap: 12px;
      input { flex: 1; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 2px; font-size: 18px; text-align: center; }
      button { padding: 0 24px; }
    }

    .success-banner {
      background: rgba(67, 233, 123, 0.1); border: 1px solid var(--accent);
      padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
      .icon { font-size: 24px; }
      .text { flex: 1; font-size: 14px; color: #d1fae5; line-height: 1.4; }
      .change-code-btn { background: transparent; color: var(--accent); font-size: 12px; font-weight: 600; text-decoration: underline; padding: 4px; }
    }

    form { display: flex; flex-direction: column; gap: 20px; }

    .input-group {
      display: flex; flex-direction: column; gap: 8px; flex: 1;
      label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
      input { background: rgba(0, 0, 0, 0.2); border: 1px solid var(--glass-border); color: white; padding: 12px 16px; border-radius: 8px; font-size: 15px;
        &:focus { outline: none; border-color: var(--primary); background: rgba(0, 0, 0, 0.4); }
      }
      .error-text { color: var(--danger); font-size: 12px; }
    }

    .row { display: flex; gap: 16px; }
    .full-width { width: 100%; margin-top: 8px; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

    .error-banner { background: rgba(255, 71, 87, 0.1); border: 1px solid var(--danger); color: #ff6b81; padding: 12px; border-radius: 8px; font-size: 13px; text-align: center; }

    .login-link { text-align: center; font-size: 14px; color: var(--text-muted); margin-top: 24px; a { color: var(--primary); text-decoration: none; font-weight: 600; } }

    .fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    .fade-in-down { animation: fadeInDown 0.4s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 600px) { .row { flex-direction: column; gap: 20px; } }
  `]
})
export class MemberRegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private inviteService = inject(InviteService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef)

  // Step 1 Controls
  codeControl = this.fb.control('', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]);
  isVerifying = false;
  codeError = '';
  verifiedOrg: Organization | null = null;
  idFieldLabel = 'Member ID';

  // Step 2 Controls
  registerForm: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    memberId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatchValidator });

  isLoading = false;
  errorMessage = '';

  forceUppercase(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.codeControl.setValue(input.value);
  }

  async verifyCode() {
    if (this.codeControl.invalid) return;

    this.isVerifying = true;
    this.codeError = '';
    const code = this.codeControl.value || '';

    try {
      const org = await this.inviteService.validateInviteCode(code);
      if (org) {
        this.verifiedOrg = org;
        // Dynamically set labels based on Org Type
        if (org.type === 'company') this.idFieldLabel = 'Employee ID';
        else if (org.type === 'college') this.idFieldLabel = 'Roll Number';
        else if (org.type === 'school') this.idFieldLabel = 'Student ID';
      } else {
        this.codeError = 'Invalid or expired invite code. Please contact your admin.';
      }
    } catch (error) {
      console.error('Code verification error', error);
      this.codeError = 'Error verifying code. Please try again.';
    } finally {
      this.isVerifying = false;
      this.cdr.detectChanges(); // <-- WAKE UP ANGULAR!
    }
  }

  resetCode() {
    this.verifiedOrg = null;
    this.codeControl.setValue('');
    this.registerForm.reset();
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async onSubmit() {
    if (this.registerForm.invalid || !this.verifiedOrg) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formVals = this.registerForm.value;

    try {
      // 1. Register Auth User
      const firebaseUser = await this.authService.registerUserAuthOnly(formVals.email, formVals.password);

      // 2. Determine Role based on Org Type
      const role = this.verifiedOrg.type === 'company' ? 'employee' : 'student';

      // 3. Construct Member Profile
      const memberProfile: any = {
        email: formVals.email,
        displayName: formVals.displayName,
        role: role,
        orgType: this.verifiedOrg.type,
        orgId: this.verifiedOrg.id
      };

      // 4. Map the dynamic ID to the correct schema field
      if (this.verifiedOrg.type === 'company') memberProfile.employeeId = formVals.memberId;
      if (this.verifiedOrg.type === 'college') memberProfile.rollNo = formVals.memberId;
      if (this.verifiedOrg.type === 'school') memberProfile.studentId = formVals.memberId;

      // 5. Create User Profile in Firestore
      await this.authService.createFirestoreUserProfile(firebaseUser.uid, memberProfile);

      // 6. Navigate to onboarding
      this.router.navigate(['/auth/onboarding']);

      // ... inside onSubmit() ...
    } catch (error: any) {
      console.error('Member registration error', error);
      this.errorMessage = error.message || 'An error occurred during registration. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        this.errorMessage = 'This email is already registered. Please sign in instead.';
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // <-- WAKE UP ANGULAR!
    }
  }
}