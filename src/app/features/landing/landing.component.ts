import { Component, ElementRef, ViewChild, AfterViewInit, NgZone, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
    @ViewChild('particleCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private ctx!: CanvasRenderingContext2D;
    private particlesArray: any[] = [];
    private animationFrameId!: number;
    private mouse = { x: -1000, y: -1000, radius: 150 };

    developers = [
        { name: 'Shraddha ', role: 'Developer', emoji: '👨‍💻', bio: 'Crafting pixel-perfect, glassmorphic UI experiences in Angular.' },
        { name: 'Prachi ', role: 'Developer', emoji: '👩‍💻', bio: 'Architecting scalable C# .NET APIs and managing databases.' },
        { name: 'Sanket ', role: 'Developer', emoji: '🚀', bio: 'Ensuring seamless data flow and robust application architecture.' },
        { name: 'Saurabh', role: 'Developer', emoji: '🕵️', bio: 'Squashing bugs and guaranteeing a flawless user experience.' }
    ];

    constructor(private ngZone: NgZone) { }

    ngAfterViewInit(): void {
        this.initCanvas();
        // Run animation outside Angular to prevent performance lag
        this.ngZone.runOutsideAngular(() => {
            this.animate();
        });
    }

    ngOnDestroy(): void {
        cancelAnimationFrame(this.animationFrameId);
    }

    @HostListener('window:resize')
    onResize() {
        this.initCanvas();
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        this.mouse.x = event.x;
        this.mouse.y = event.y;
    }

    @HostListener('document:mouseleave')
    onMouseLeave() {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
    }

    private initCanvas() {
        const canvas = this.canvasRef.nativeElement;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.ctx = canvas.getContext('2d')!;
        this.particlesArray = [];

        // Create particles based on screen size
        const numberOfParticles = (canvas.width * canvas.height) / 15000;

        for (let i = 0; i < numberOfParticles; i++) {
            const size = (Math.random() * 2) + 1;
            const x = Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2;
            const y = Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2;
            const directionX = (Math.random() * 1) - 0.5;
            const directionY = (Math.random() * 1) - 0.5;
            const color = '#58a6ff';

            this.particlesArray.push(new Particle(x, y, directionX, directionY, size, color, canvas, this.ctx, this.mouse));
        }
    }

    private animate = () => {
        this.ctx.clearRect(0, 0, innerWidth, innerHeight);

        for (let i = 0; i < this.particlesArray.length; i++) {
            this.particlesArray[i].update();
        }
        this.connect();
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    private connect() {
        let opacityValue = 1;
        for (let a = 0; a < this.particlesArray.length; a++) {
            for (let b = a; b < this.particlesArray.length; b++) {
                const distance = ((this.particlesArray[a].x - this.particlesArray[b].x) * (this.particlesArray[a].x - this.particlesArray[b].x))
                    + ((this.particlesArray[a].y - this.particlesArray[b].y) * (this.particlesArray[a].y - this.particlesArray[b].y));

                if (distance < (this.canvasRef.nativeElement.width / 7) * (this.canvasRef.nativeElement.height / 7)) {
                    opacityValue = 1 - (distance / 20000);
                    this.ctx.strokeStyle = `rgba(88, 166, 255, ${opacityValue})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particlesArray[a].x, this.particlesArray[a].y);
                    this.ctx.lineTo(this.particlesArray[b].x, this.particlesArray[b].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

class Particle {
    constructor(
        public x: number, public y: number, public directionX: number, public directionY: number,
        public size: number, public color: string, private canvas: HTMLCanvasElement,
        private ctx: CanvasRenderingContext2D, private mouse: any
    ) { }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        this.ctx.fillStyle = '#00f2fe';
        this.ctx.fill();
    }

    update() {
        // Check window bounds
        if (this.x > this.canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > this.canvas.height || this.y < 0) this.directionY = -this.directionY;

        // Check mouse collision / interactivity
        const dx = this.mouse.x - this.x;
        const dy = this.mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mouse.radius + this.size) {
            if (this.mouse.x < this.x && this.x < this.canvas.width - this.size * 10) this.x += 3;
            if (this.mouse.x > this.x && this.x > this.size * 10) this.x -= 3;
            if (this.mouse.y < this.y && this.y < this.canvas.height - this.size * 10) this.y += 3;
            if (this.mouse.y > this.y && this.y > this.size * 10) this.y -= 3;
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}