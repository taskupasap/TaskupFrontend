import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Organization } from '../models';

@Injectable({
    providedIn: 'root'
})
export class InviteService {
    private firestore = inject(Firestore);

    // Generates a random 6-character alphanumeric uppercase code
    generateInviteCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Validates if an invite code exists and is not expired
    async validateInviteCode(code: string): Promise<Organization | null> {
        try {
            if (!code || code.trim() === '') return null;

            const upperCode = code.toUpperCase().trim();
            const orgsRef = collection(this.firestore, 'organizations');
            const q = query(orgsRef, where('inviteCode', '==', upperCode));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return null; // Code not found
            }

            const docSnapshot = querySnapshot.docs[0];
            const orgData = docSnapshot.data();

            // Check expiration if it exists
            if (orgData['inviteCodeExpiry']) {
                const expiryDate = orgData['inviteCodeExpiry'].toDate();
                if (new Date() > expiryDate) {
                    return null; // Code is expired
                }
            }

            return {
                id: docSnapshot.id,
                ...orgData,
                createdAt: orgData['createdAt']?.toDate(),
                inviteCodeCreatedAt: orgData['inviteCodeCreatedAt']?.toDate(),
                inviteCodeExpiry: orgData['inviteCodeExpiry'] ? orgData['inviteCodeExpiry'].toDate() : null
            } as Organization;

        } catch (error) {
            console.error('Error validating invite code', error);
            throw error;
        }
    }
}