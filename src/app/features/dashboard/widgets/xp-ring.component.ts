import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-xp-ring',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="xp-container">
      <svg viewBox="0 0 100 100">
        <circle class="bg" cx="50" cy="50" r="45"></circle>
        <circle class="progress" cx="50" cy="50" r="45" 
          [style.strokeDashoffset]="offset"></circle>
      </svg>
      <div class="info">
        <span class="level">LVL {{ level }}</span>
        <span class="xp">{{ xp % 500 }} / 500 XP</span>
      </div>
    </div>
  `,
    styles: [`
    .xp-container { position: relative; width: 150px; height: 150px; }
    svg { transform: rotate(-90deg); }
    circle { fill: none; stroke-width: 8; stroke-linecap: round; }
    .bg { stroke: rgba(255, 255, 255, 0.05); }
    .progress { 
      stroke: var(--primary); 
      stroke-dasharray: 283; 
      transition: stroke-dashoffset 1s ease-in-out;
    }
    .info { 
      position: absolute; inset: 0; display: flex; flex-direction: column; 
      align-items: center; justify-content: center; 
    }
    .level { font-family: var(--font-primary); font-weight: 800; font-size: 20px; }
    .xp { font-size: 12px; color: var(--text-muted); }
  `]
})
export class XpRingComponent {
    @Input() xp: number = 0;
    @Input() level: number = 1;

    get offset() {
        const percent = (this.xp % 500) / 500;
        return 283 - (283 * percent);
    }
}