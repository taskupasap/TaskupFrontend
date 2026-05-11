import { Component, Input, OnInit, ElementRef, ViewChild, ChangeDetectorRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pdfjsLib from 'pdfjs-dist';

// 🚨 RELIABLE WORKER CDN: Uses unpkg to ensure it always matches your exact installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

@Component({
    selector: 'app-pdf-viewer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="pdf-container" style="background: #0d1117; border-radius: 8px; padding: 16px; border: 1px solid #30363d; display: flex; flex-direction: column; align-items: center; gap: 16px;">
      
      @if (loading && !errorMessage) {
        <div style="color: #58a6ff; font-family: 'JetBrains Mono', monospace; font-size: 14px; padding: 40px;">
          ⏳ Rendering Document: {{ progress }}%
        </div>
      }

      @if (errorMessage) {
        <div style="background: rgba(248, 81, 73, 0.1); border: 1px solid #f85149; padding: 16px; border-radius: 8px; color: #ff7b72; max-width: 100%; text-align: center;">
          <h4 style="margin: 0 0 8px 0;">⚠️ PDF Render Failed</h4>
          <p style="margin: 0; font-size: 13px;">{{ errorMessage }}</p>
        </div>
      }

      <canvas #pdfCanvas [style.display]="(loading || errorMessage) ? 'none' : 'block'" style="box-shadow: 0 8px 24px rgba(0,0,0,0.5); border-radius: 4px;"></canvas>
      
      @if (!loading && !errorMessage) {
        <div class="pdf-controls" style="display: flex; gap: 12px; align-items: center; background: #161b22; padding: 8px 16px; border-radius: 20px; border: 1px solid #30363d;">
          <button class="btn-run" (click)="prevPage()" [disabled]="pageNumber <= 1" style="padding: 4px 10px; border: none; background: transparent; color: #58a6ff; cursor: pointer;">◀ Prev</button>
          <span style="color: #c9d1d9; font-size: 13px; font-weight: bold;">Page {{ pageNumber }} of {{ totalPages }}</span>
          <button class="btn-run" (click)="nextPage()" [disabled]="pageNumber >= totalPages" style="padding: 4px 10px; border: none; background: transparent; color: #58a6ff; cursor: pointer;">Next ▶</button>
        </div>
      }
    </div>
  `
})
export class PdfViewerComponent implements OnInit {
    @Input() pdfUrl!: string;
    @ViewChild('pdfCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private cdr = inject(ChangeDetectorRef);

    pdfDoc: any = null;
    pageNumber = 1;
    totalPages = 0;
    loading = true;
    progress = 0;
    errorMessage = '';

    ngOnInit() {
        this.loadPdf();
    }

    // Optional: Re-render if the user resizes their browser window
    @HostListener('window:resize')
    onResize() {
        if (!this.loading && this.pdfDoc) {
            this.renderPage(this.pageNumber);
        }
    }

    private loadPdf() {
        this.loading = true;
        this.errorMessage = '';
        this.cdr.detectChanges();

        const loadingTask = pdfjsLib.getDocument(this.pdfUrl);

        loadingTask.onProgress = (progressData: any) => {
            if (progressData.total > 0) {
                this.progress = Math.round((progressData.loaded / progressData.total) * 100);
                this.cdr.detectChanges();
            }
        };

        loadingTask.promise.then((pdf: any) => {
            this.pdfDoc = pdf;
            this.totalPages = pdf.numPages;
            this.loading = false;
            this.cdr.detectChanges();

            // Give Angular a tiny delay to ensure the canvas is visible before painting
            setTimeout(() => this.renderPage(this.pageNumber), 50);

        }).catch(err => {
            console.error('PDF.js Error:', err);
            this.loading = false;

            // Catch common errors
            if (err.name === 'MissingPDFException' || err.message.includes('CORS')) {
                this.errorMessage = 'Cloudinary CORS is blocking access. Cannot read binary data.';
            } else {
                this.errorMessage = err.message;
            }
            this.cdr.detectChanges();
        });
    }

    renderPage(num: number) {
        if (!this.pdfDoc || !this.canvasRef) return;

        this.pdfDoc.getPage(num).then((page: any) => {
            const canvas = this.canvasRef.nativeElement;
            const context = canvas.getContext('2d')!;

            // 1. Responsive Scaling: Find out how much space we actually have in the UI
            const containerWidth = canvas.parentElement?.clientWidth || 800;

            // 2. Get the unscaled document width
            const unscaledViewport = page.getViewport({ scale: 1.0 });

            // 3. Calculate a scale that fits our UI perfectly (leave 40px for padding)
            const dynamicScale = Math.min((containerWidth - 40) / unscaledViewport.width, 1.5);
            const viewport = page.getViewport({ scale: dynamicScale });

            // 4. Retina / HD Display Fix: Multiply canvas size by pixel ratio to prevent blur
            const outputScale = window.devicePixelRatio || 1;

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);

            // 5. Shrink it back down with CSS so it compresses the extra pixels into a sharp image
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height = Math.floor(viewport.height) + "px";

            const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

            const renderContext = {
                canvasContext: context,
                transform: transform,
                viewport: viewport
            };

            page.render(renderContext);
        });
    }

    prevPage() {
        if (this.pageNumber <= 1) return;
        this.pageNumber--;
        this.renderPage(this.pageNumber);
    }

    nextPage() {
        if (this.pageNumber >= this.totalPages) return;
        this.pageNumber++;
        this.renderPage(this.pageNumber);
    }
}