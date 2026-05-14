import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { authGuard, publicGuard } from './core/guards/auth.guard'; // Adjust path if needed

@Component({
    standalone: true,
    template: '<h2 style="color: var(--primary); padding: 24px;">Welcome to TaskUp! The shell is working perfectly. 🚀</h2>'
})
export class DummyComponent { }

export const routes: Routes = [
    // ---------------------------------------------------------
    // 🔓 PUBLIC ROUTES (No Sidebar, Protected by publicGuard)
    // ---------------------------------------------------------

    // 🚨 THE FIX: The new Base Landing Page!
    {
        path: '',
        pathMatch: 'full',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
    },
    {
        path: 'auth/login',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    // 🚨 FIX 1: Point the base register route to the Hub!
    {
        path: 'auth/register',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/auth/register/org-type-select/org-type-select.component').then(m => m.OrgTypeSelectComponent)
    },
    // 🚨 FIX 2: Add the Admin route for workspace creators
    {
        path: 'auth/register/admin',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/auth/register/admin-register/admin-register.component').then(m => m.AdminRegisterComponent)
    },
    // 🚨 FIX 3: Add the Member route (This is exactly where the "Join via Code" button points!)
    {
        path: 'auth/register/member',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/auth/register/member-register/member-register.component').then(m => m.MemberRegisterComponent)
    },
    // (Optional Shortcut) Keep /join as a quick invite link you can email to people
    {
        path: 'join',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/auth/register/member-register/member-register.component').then(m => m.MemberRegisterComponent)
    },

    // ---------------------------------------------------------
    // 🔒 PRIVATE APP ROUTES (Wrapped in Sidebar Shell)
    // ---------------------------------------------------------
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'tasks',
                loadComponent: () => import('./features/tasks/task-list.component').then(m => m.TaskListComponent)
            },
            {
                path: 'gamification',
                loadComponent: () => import('./features/gamification/leaderboard.component').then(m => m.LeaderboardComponent)
            },
            // <-- MOVED INSIDE THE SHELL! Now it keeps the sidebar!
            {
                path: 'member/:id',
                loadComponent: () => import('./features/admin/member-profile/member-profile.component').then(m => m.MemberProfileComponent)
            }
        ]
    },

    // Fallback route
    { path: '**', redirectTo: 'dashboard' }
];