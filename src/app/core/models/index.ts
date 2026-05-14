export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    role: 'superadmin' | 'admin' | 'employee' | 'student';
    orgType: 'company' | 'college' | 'school';
    orgId: string;
    department?: string;
    rollNo?: string;
    studentId?: string;
    employeeId?: string;
    xp: number;
    level: number;
    streak: number;
    lastLoginDate: Date;
    badges: string[];
    teamIds: string[];
    themePreference: 'light' | 'dark' | 'system';
    notificationPrefs: { email: boolean; inApp: boolean; deadlineReminder: boolean };
    createdAt: Date;
    updatedAt: Date;
}

export interface Organization {
    id: string;
    name: string;
    type: 'company' | 'college' | 'school';
    logoUrl: string;
    themeColor: string;
    adminIds: string[];
    inviteCode: string;
    inviteCodeExpiry: Date | null;
    inviteCodeCreatedAt: Date;
    memberJoinHistory: { userId: string; joinedAt: Date; inviteCode: string }[];
    createdAt: Date;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    type: 'coding' | 'quiz' | 'file_submission' | 'course' | 'research';
    priority: 'high' | 'medium' | 'low';
    status: 'todo' | 'inprogress' | 'review' | 'completed';
    assignedTo: string[];
    assignedBy: string;
    orgId: string;
    teamId: string | null;
    deadline: Date;
    xpReward: number;
    subtasks: { id: string; title: string; completed: boolean }[];
    attachments: { url: string; publicId: string; name: string; type: string }[];
    tags: string[];
    isRecurring: boolean;
    recurringInterval: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    attachmentUrl?: string;
    pendingReviewCount?: number;
}
export interface LeaderboardUser {
    id: string;
    displayName: string;
    xp: number;
    level: number;
    role: string;
    pendingReviews?: number; // <-- 🚨 NEW: Tracks how many tasks need grading
}