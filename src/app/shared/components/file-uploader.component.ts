import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Component({
    selector: 'app-file-uploader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="upload-zone glass-card" 
         (click)="fileInput.click()"
         (dragover)="onDragOver($event)"
         (drop)="onDrop($event)">
      
      <input type="file" #fileInput (change)="onFileSelected($event)" hidden>
      
      @if (isUploading) {
        <div class="loader">
          <div class="spinner"></div>
          <p>Uploading to Cloudinary...</p>
        </div>
      } @else {
        <span class="icon">☁️</span>
        <p><strong>Click or Drag</strong> to upload attachments</p>
        <p class="limit">Max 10MB (PDF, PNG, JPG)</p>
      }
    </div>
  `,
    styles: [`
    .upload-zone {
      border: 2px dashed var(--glass-border);
      padding: 30px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover { border-color: var(--primary); background: rgba(108, 99, 255, 0.05); }
    }
    .icon { font-size: 32px; display: block; margin-bottom: 12px; }
    p { margin: 0; font-size: 14px; }
    .limit { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
    .spinner {
      width: 30px; height: 30px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FileUploaderComponent {
    private http = inject(HttpClient);
    @Output() onUploadComplete = new EventEmitter<any>();
    isUploading = false;

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        const file = event.dataTransfer?.files[0];
        if (file) this.upload(file);
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) this.upload(file);
    }

    private upload(file: File) {
        this.isUploading = true;
        const formData = new FormData();
        formData.append('file', file);

        this.http.post(`${environment.apiUrl}/files/upload`, formData)
            .subscribe({
                next: (res) => {
                    this.isUploading = false;
                    this.onUploadComplete.emit(res);
                },
                error: () => this.isUploading = false
            });
    }
}