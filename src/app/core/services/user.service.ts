import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, updateDoc, increment } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);

    getUserProfile(uid: string): Observable<User> {
        const userRef = doc(this.firestore, `users/${uid}`);
        return docData(userRef) as Observable<User>;
    }

    // Formula: Level = Floor(Total XP / 500) + 1
    calculateLevel(xp: number): number {
        return Math.floor(xp / 500) + 1;
    }

    getXPToNextLevel(xp: number): number {
        return 500 - (xp % 500);
    }

    async addXP(uid: string, amount: number) {
        const userRef = doc(this.firestore, `users/${uid}`);
        await updateDoc(userRef, {
            xp: increment(amount)
        });
    }
}