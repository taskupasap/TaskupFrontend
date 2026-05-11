import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./register/org-type-select/org-type-select.component').then(m => m.OrgTypeSelectComponent)
    },
    {
        path: 'register/admin',
        loadComponent: () => import('./register/admin-register/admin-register.component').then(m => m.AdminRegisterComponent)
    },
    {
        path: 'register/member',
        loadComponent: () => import('./register/member-register/member-register.component').then(m => m.MemberRegisterComponent)
    },
    {
        path: 'onboarding',
        loadComponent: () => import('./onboarding/onboarding.component').then(m => m.OnboardingComponent)
    }
];