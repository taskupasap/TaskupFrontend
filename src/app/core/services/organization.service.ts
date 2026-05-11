import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Organization } from '../models';

@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    private firestore = inject(Firestore);

    async createOrganization(orgData: Partial<Organization>): Promise<string> {
        try {
            // Create a reference to a new document with an auto-generated ID
            const orgsRef = collection(this.firestore, 'organizations');
            const newOrgDoc = doc(orgsRef);

            const fullOrgData = {
                id: newOrgDoc.id,
                name: orgData.name || 'New Organization',
                type: orgData.type || 'company',
                logoUrl: orgData.logoUrl || '',
                themeColor: orgData.themeColor || '#6C63FF', // Brand primary default
                adminIds: orgData.adminIds || [],
                inviteCode: orgData.inviteCode || '',
                inviteCodeExpiry: orgData.inviteCodeExpiry || null,
                inviteCodeCreatedAt: new Date(),
                memberJoinHistory: [],
                createdAt: new Date(),
                ...orgData
            };

            await setDoc(newOrgDoc, fullOrgData);
            return newOrgDoc.id; // Return the generated ID so we can link the user to it
        } catch (error) {
            console.error('Error creating organization:', error);
            throw error;
        }
    }

    async getOrganization(orgId: string): Promise<Organization | null> {
        try {
            const orgRef = doc(this.firestore, `organizations/${orgId}`);
            const orgSnap = await getDoc(orgRef);

            if (orgSnap.exists()) {
                const data = orgSnap.data();

                // Convert Firestore Timestamps back to JavaScript Dates
                return {
                    ...data,
                    id: orgSnap.id,
                    inviteCodeExpiry: data['inviteCodeExpiry'] ? data['inviteCodeExpiry'].toDate() : null,
                    inviteCodeCreatedAt: data['inviteCodeCreatedAt']?.toDate(),
                    createdAt: data['createdAt']?.toDate()
                } as Organization;
            }
            return null;
        } catch (error) {
            console.error('Error fetching organization:', error);
            throw error;
        }
    }
}