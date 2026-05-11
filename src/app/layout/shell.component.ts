import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './shell.component.html',
    styleUrl: './shell.component.scss' // Or .scss if you are using SASS
})
export class ShellComponent {
    // MUST be public so the HTML template can access it!
    public auth: AuthService = inject(AuthService);
    public themeService = inject(ThemeService); // <-- Inject it (make it public)
    private router: Router = inject(Router);

    isSidebarOpen = false;

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    async logout() {
        try {
            await this.auth.logout();
            this.router.navigate(['/auth/login']);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
}