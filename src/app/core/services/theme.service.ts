import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    public isDarkMode = true;

    constructor() {
        this.loadTheme();
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        // Save their preference to the browser
        localStorage.setItem('taskup-theme', this.isDarkMode ? 'dark' : 'light');
    }

    private loadTheme() {
        const savedTheme = localStorage.getItem('taskup-theme');
        if (savedTheme) {
            this.isDarkMode = savedTheme === 'dark';
        } else {
            // If no saved theme, check their OS system preference!
            this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        this.applyTheme();
    }

    private applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
    }
}