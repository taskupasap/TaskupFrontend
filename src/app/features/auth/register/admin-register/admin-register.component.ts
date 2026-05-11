import { Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OrganizationService } from '../../../../core/services/organization.service';
import { InviteService } from '../../../../core/services/invite.service';

// Custom validator to check if passwords match
export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="aurora-bg"></div>
    <div class="auth-container">
      <div class="glass-card register-box fade-in-up">
        
        <button class="back-btn" (click)="goBack()">← Back</button>

        <div class="header">
          <div class="org-badge" *ngIf="!showOptions">{{ orgIcon }} {{ orgTypeLabel }}</div>
          <h2>Create Workspace</h2>
          <p class="subtitle">
            {{ showOptions ? 'What kind of organization are you setting up?' : 'Set up your ' + orgTypeLabel.toLowerCase() + ' and your admin account.' }}
          </p>
        </div>

        <div class="org-options" *ngIf="showOptions">
          
          <div class="org-card" (click)="selectType('company')">
            <div class="org-icon">🏢</div>
            <h3>Company</h3>
            <p>For businesses and professional teams.</p>
          </div>

          <div class="org-card" (click)="selectType('college')">
            <div class="org-icon">🎓</div>
            <h3>College</h3>
            <p>For universities and department faculties.</p>
          </div>

          <div class="org-card" (click)="selectType('school')">
            <div class="org-icon">🏫</div>
            <h3>School</h3>
            <p>For K-12 education and student groups.</p>
          </div>

        </div>
        
        <form *ngIf="!showOptions" [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="fade-in-down">
          
          <div class="input-group">
            <label for="orgName">{{ orgTypeLabel }} Name</label>
            <input id="orgName" type="text" formControlName="orgName" placeholder="e.g. Acme Corp">
            <span class="error-text" *ngIf="isFieldInvalid('orgName')">Organization name is required.</span>
          </div>

          <div class="divider"><span>Admin Details</span></div>

          <div class="input-group">
            <label for="displayName">Your Full Name</label>
            <input id="displayName" type="text" formControlName="displayName" placeholder="John Doe">
            <span class="error-text" *ngIf="isFieldInvalid('displayName')">Your name is required.</span>
          </div>
          
          <div class="input-group">
            <label for="email">Work Email</label>
            <input id="email" type="email" formControlName="email" placeholder="john@company.com">
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

          <div class="terms-group">
            <input type="checkbox" id="terms" formControlName="terms">
            <label for="terms">I agree to the <a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a>.</label>
          </div>

          <div class="error-banner" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-primary full-width" [disabled]="registerForm.invalid || isLoading">
            {{ isLoading ? 'Creating Workspace...' : 'Create Account' }}
          </button>
        </form>

        <p class="login-link" *ngIf="showOptions">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; z-index: 1; }
    .register-box { width: 100%; max-width: 550px; padding: 40px; position: relative; transition: all 0.3s; }
    
    .back-btn { position: absolute; top: 24px; left: 24px; background: transparent; border: none; color: var(--text-muted); font-size: 14px; padding: 4px 8px; cursor: pointer; transition: 0.2s; }
    .back-btn:hover { color: white; transform: translateX(-2px); }
    
    .header { text-align: center; margin-bottom: 32px; margin-top: 16px; }
    .org-badge { display: inline-block; background: rgba(108, 99, 255, 0.15); color: var(--primary); padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 16px; border: 1px solid rgba(108, 99, 255, 0.3); }
    h2 { font-size: 28px; margin: 0 0 8px 0; }
    .subtitle { color: var(--text-muted); font-size: 14px; margin: 0; }

    /* Step 1: Organization Cards */
    .org-options { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .org-card { background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; transition: all 0.3s ease; }
    .org-card:hover { background: rgba(108, 99, 255, 0.1); border-color: var(--primary); transform: translateY(-2px); }
    .org-icon { font-size: 32px; margin-bottom: 12px; }
    .org-card h3 { margin: 0 0 8px 0; font-size: 18px; color: white; }
    .org-card p { margin: 0; font-size: 13px; color: var(--text-muted); }

    /* For horizontal cards on larger screens */
    @media (min-width: 500px) {
      .org-options { flex-direction: row; justify-content: space-between; }
      .org-card { flex: 1; padding: 24px 16px; }
    }

    form { display: flex; flex-direction: column; gap: 20px; }
    .input-group { display: flex; flex-direction: column; gap: 8px; flex: 1; label { font-size: 13px; font-weight: 600; color: var(--text-muted); } input { background: rgba(0, 0, 0, 0.2); border: 1px solid var(--glass-border); color: white; padding: 12px 16px; border-radius: 8px; font-size: 15px; &:focus { outline: none; border-color: var(--primary); background: rgba(0, 0, 0, 0.4); } } .error-text { color: var(--danger); font-size: 12px; } }
    .row { display: flex; gap: 16px; }
    .divider { display: flex; align-items: center; color: var(--text-muted); font-size: 12px; margin: 8px 0; &::before, &::after { content: ''; flex: 1; border-bottom: 1px solid var(--glass-border); } span { padding: 0 10px; text-transform: uppercase; letter-spacing: 1px; } }
    .terms-group { display: flex; align-items: flex-start; gap: 12px; margin-top: 8px; input { margin-top: 3px; cursor: pointer; } label { font-size: 12px; color: var(--text-muted); line-height: 1.5; } a { color: var(--primary); text-decoration: none; } a:hover { text-decoration: underline; } }
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
export class AdminRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private orgService = inject(OrganizationService);
  private inviteService = inject(InviteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  // STATE CONTROLS
  showOptions = true;
  orgType: 'company' | 'college' | 'school' = 'company';
  orgTypeLabel = 'Company';
  orgIcon = '🏢';

  registerForm: FormGroup = this.fb.group({
    orgName: ['', Validators.required],
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    terms: [false, Validators.requiredTrue]
  }, { validators: passwordsMatchValidator });

  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    // If a specific URL parameter is passed, skip the options and go straight to the form
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.selectType(params['type'] as 'company' | 'college' | 'school');
      }
    });
  }

  // Triggered when a user clicks one of the 3 org cards
  selectType(type: 'company' | 'college' | 'school') {
    this.orgType = type;
    if (type === 'college') {
      this.orgTypeLabel = 'College';
      this.orgIcon = '🎓';
    } else if (type === 'school') {
      this.orgTypeLabel = 'School';
      this.orgIcon = '🏫';
    } else {
      this.orgTypeLabel = 'Company';
      this.orgIcon = '🏢';
    }
    this.showOptions = false; // Hide cards, show form
  }

  // Handles the top-left Back button
  goBack() {
    if (this.showOptions) {
      // Already on step 1? Go back to login page
      this.router.navigate(['/auth/login']);
    } else {
      // On step 2? Go back to step 1 options
      this.showOptions = true;
      this.registerForm.reset();
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formVals = this.registerForm.value;

    try {
      // 1. Register Auth User
      const firebaseUser = await this.authService.registerUserAuthOnly(formVals.email, formVals.password);

      // 2. Generate Invite Code
      const inviteCode = this.inviteService.generateInviteCode();

      // 3. Create Organization in Firestore
      const orgId = await this.orgService.createOrganization({
        name: formVals.orgName,
        type: this.orgType,
        adminIds: [firebaseUser.uid],
        inviteCode: inviteCode
      });

      // 4. Create User Profile (Admin) linked to Org
      await this.authService.createFirestoreUserProfile(firebaseUser.uid, {
        email: formVals.email,
        displayName: formVals.displayName,
        role: 'admin',
        orgType: this.orgType,
        orgId: orgId
      });

      // WRAPPED IN NGZONE
      this.ngZone.run(() => {
        this.router.navigate(['/auth/onboarding']);
      });

    } catch (error: any) {
      console.error('Admin registration error', error);

      // WRAPPED IN NGZONE
      this.ngZone.run(() => {
        this.isLoading = false;
        this.errorMessage = error.message || 'An error occurred. Please check your connection and Firebase setup.';

        if (error.code === 'auth/email-already-in-use') {
          this.errorMessage = 'This email is already registered. Please sign in instead.';
        }
      });
    }
  }
}