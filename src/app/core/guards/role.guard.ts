import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Auth, authState } from '@angular/fire/auth';
import { switchMap, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const authService = inject(AuthService);
    const router = inject(Router);

    // The roles allowed to access this route, defined in app.routes.ts
    const expectedRoles: string[] = route.data['roles'] || [];

    // Wait for Firebase Auth state to resolve first to prevent hard-reload race conditions
    return authState(auth).pipe(
        take(1),
        switchMap(firebaseUser => {
            if (!firebaseUser) {
                router.navigate(['/auth/login']);
                return of(false);
            }

            // Fetch the custom user profile to check their specific role
            return authService.getFirestoreUserProfile(firebaseUser.uid).then(userProfile => {
                if (!userProfile) {
                    router.navigate(['/auth/login']);
                    return false;
                }

                // If no specific roles are required, or the user's role is in the allowed list
                if (expectedRoles.length === 0 || expectedRoles.includes(userProfile.role)) {
                    return true;
                } else {
                    // User doesn't have permission, kick them to the dashboard
                    console.warn('Access denied: Insufficient role permissions');
                    router.navigate(['/dashboard']);
                    return false;
                }
            });
        })
    );
};