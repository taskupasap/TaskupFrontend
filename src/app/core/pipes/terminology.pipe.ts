import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'term',
    standalone: true
})
export class TerminologyPipe implements PipeTransform {

    transform(word: string): string {
        // 1. Get the current workspace type (default to company if not found)
        const workspaceType = (localStorage.getItem('workspaceType') || 'company').toLowerCase();
        const isSchool = workspaceType === 'school' || workspaceType === 'college' || workspaceType === 'university';

        // 2. The Master Dictionary
        const dictionary: { [key: string]: { company: string, school: string } } = {
            'employee': { company: 'Employee', school: 'Student' },
            'employees': { company: 'Employees', school: 'Students' },
            'manager': { company: 'Manager', school: 'Teacher' },
            'managers': { company: 'Managers', school: 'Teachers' },
            'admin': { company: 'Manager (Admin)', school: 'Teacher (Admin)' },
            'task': { company: 'Task', school: 'Assignment' },
            'tasks': { company: 'Tasks', school: 'Assignments' },
            'workspace': { company: 'Company Workspace', school: 'School Campus' },
            'master tasks': { company: 'Master Tasks', school: 'Master Assignments' }
        };

        const key = word.toLowerCase();

        // If the word isn't in our dictionary, just return the word normally
        if (!dictionary[key]) return word;

        // 3. Fetch the correct translated word
        const translated = isSchool ? dictionary[key].school : dictionary[key].company;

        // 4. SMART FORMATTING: Match the capitalization of the input!
        // If they typed 'Employee', it returns 'Student'. If 'employee', returns 'student'.
        const isCapitalized = word.charAt(0) === word.charAt(0).toUpperCase();
        return isCapitalized ? translated.charAt(0).toUpperCase() + translated.slice(1) : translated.toLowerCase();
    }
}