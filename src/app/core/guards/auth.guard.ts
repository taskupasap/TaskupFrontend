import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators'; // <-- Added take here!

// 🛡️ GUARD 1: Protects Private Pages (Dashboard, Tasks)
export const authGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);

    return authState(auth).pipe(
        take(1), // <-- MAGIC FIX: Tells the router to stop listening and just load the page!
        map(user => {
            if (user) {
                return true;
            } else {
                router.navigate(['/auth/login']);
                return false;
            }
        })
    );
};

// 🛡️ GUARD 2: Protects Public Pages (Login, Register, Join)
export const publicGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);

    return authState(auth).pipe(
        take(1), // <-- MAGIC FIX: Tells the router to stop listening and just load the page!
        map(user => {
            if (!user) {
                return true;
            } else {
                router.navigate(['/dashboard']);
                return false;
            }
        })
    );
};