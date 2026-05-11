import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, authState, User as FirebaseUser } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { User } from '../models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);

    // Holds the current authenticated user's Firestore profile
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();


    constructor() {
        // Listen to Firebase Auth state changes
        authState(this.auth).pipe(
            switchMap((firebaseUser) => {
                if (firebaseUser) {
                    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);

                    // REAL-TIME MAGIC: Native Firebase onSnapshot wrapped in an Observable
                    return new Observable<User | null>(observer => {
                        const unsubscribe = onSnapshot(userRef, (snap) => {
                            if (snap.exists()) {
                                const data = snap.data();
                                // Convert Firestore Timestamps to JS Dates
                                observer.next({
                                    ...data,
                                    lastLoginDate: data['lastLoginDate']?.toDate() || new Date(),
                                    createdAt: data['createdAt']?.toDate() || new Date(),
                                    updatedAt: data['updatedAt']?.toDate() || new Date()
                                } as User);
                            } else {
                                observer.next(null);
                            }
                        }, (error) => observer.error(error));

                        // Cleanup listener when unsubscribed
                        return () => unsubscribe();
                    });
                } else {
                    return of(null);
                }
            })
        ).subscribe({
            next: (userProfile) => {
                if (userProfile) {
                    this.currentUserSubject.next(userProfile);
                }
            },
            error: (err) => console.error("Auth State Subscription Error:", err)
        });
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    async login(email: string, password: string): Promise<void> {
        try {
            await signInWithEmailAndPassword(this.auth, email, password);
            this.router.navigate(['/dashboard']);
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    }

    async loginWithGoogle(): Promise<void> {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);

            // Check if user exists in Firestore, if not, we need them to complete onboarding
            const userProfile = await this.getFirestoreUserProfile(result.user.uid);
            if (!userProfile) {
                // New Google User - navigate to registration org-type select to finish setup
                this.router.navigate(['/auth/register']);
            } else {
                this.router.navigate(['/dashboard']);
            }
        } catch (error) {
            console.error('Google login failed', error);
            throw error;
        }
    }

    async registerUserAuthOnly(email: string, password: string): Promise<FirebaseUser> {
        try {
            const result = await createUserWithEmailAndPassword(this.auth, email, password);
            return result.user;
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    }

    async createFirestoreUserProfile(uid: string, profileData: Partial<User>): Promise<void> {
        try {
            const userRef = doc(this.firestore, `users/${uid}`);

            // Construct the full profile
            const fullProfile: User = {
                uid,
                email: profileData.email || '',
                displayName: profileData.displayName || 'New User',
                photoURL: profileData.photoURL || '',
                role: profileData.role || 'employee',
                orgType: profileData.orgType || 'company',
                orgId: profileData.orgId || '',
                xp: 0,
                level: 1,
                streak: 0,
                lastLoginDate: new Date(),
                badges: [],
                teamIds: [],
                themePreference: 'system',
                notificationPrefs: { email: true, inApp: true, deadlineReminder: true },
                createdAt: new Date(),
                updatedAt: new Date(),
                ...profileData
            };

            // 1. Wait for Firestore to finish saving
            await setDoc(userRef, fullProfile);

            // 2. FORCE the app to see the new data immediately
            this.currentUserSubject.next(fullProfile);

        } catch (error) {
            console.error('Failed to create user profile', error);
            throw error;
        }
    }

    async getFirestoreUserProfile(uid: string): Promise<User | null> {
        try {
            const userRef = doc(this.firestore, `users/${uid}`);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                // Convert Firestore Timestamps to JS Dates
                return {
                    ...data,
                    lastLoginDate: data['lastLoginDate']?.toDate() || new Date(),
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date()
                } as User;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            return null;
        }
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
    }

    async getToken(): Promise<string | null> {
        const user = this.auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }
}