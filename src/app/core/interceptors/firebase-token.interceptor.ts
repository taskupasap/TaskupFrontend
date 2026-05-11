import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { from, switchMap } from 'rxjs';

export const firebaseTokenInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    // Convert the Promise from authService.getToken() into an Observable
    return from(authService.getToken()).pipe(
        switchMap(token => {
            // If a token exists, clone the request and attach the Authorization header
            if (token) {
                const clonedRequest = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return next(clonedRequest);
            }

            // If no token (e.g., user is not logged in yet), send the original request
            return next(req);
        })
    );
};