import {Component, EventEmitter, inject, Input, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule, Loader2, Upload} from 'lucide-angular';
import {finalize, map, switchMap} from 'rxjs';
import {SchoolService} from '../../../core/services/school.service';
import {DocumentEngineService} from '../../../core/services/document-engine.service';
import {NotificationService} from '../../services/notification.service';

/**
 * Widget d'upload d'image réutilisable pour le branding école (logo/couverture) :
 * demande un ticket au backend (proxy identity-service -> document-engine-service,
 * mode PUBLIC permanent), PUT direct du fichier, puis émet l'URL publique finale.
 */
@Component({
  selector: 'app-image-upload-field',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="image-upload-field" [class.disabled]="disabled">
      <div class="preview" [class.wide]="aspect === 'wide'">
        <img *ngIf="currentUrl" [src]="currentUrl" alt="" />
        <lucide-icon *ngIf="!currentUrl && !isUploading()" [name]="Upload" [size]="20" class="placeholder-icon"></lucide-icon>
        <lucide-icon *ngIf="isUploading()" [name]="Loader2" [size]="20" class="placeholder-icon animate-spin"></lucide-icon>
      </div>
      <div class="upload-body">
        <input #fileInput type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden-input"
               (change)="onFileSelected($event)" [disabled]="disabled || isUploading()" />
        <button type="button" class="upload-btn" [disabled]="disabled || isUploading()" (click)="fileInput.click()">
          {{ isUploading() ? 'Envoi en cours...' : (currentUrl ? 'Changer l\\'image' : 'Choisir une image') }}
        </button>
        <p class="hint" *ngIf="hint">{{ hint }}</p>
      </div>
    </div>
  `,
  styles: [`
    .image-upload-field {
      display: flex;
      align-items: center;
      gap: 16px;

      &.disabled { opacity: 0.6; pointer-events: none; }
    }

    .preview {
      width: 72px;
      height: 72px;
      border-radius: var(--fw-radius-lg);
      background: var(--fw-surface-sunken);
      border: 1px dashed var(--fw-border);
      display: grid;
      place-items: center;
      overflow: hidden;
      flex-shrink: 0;

      &.wide { width: 128px; aspect-ratio: 16 / 9; height: auto; }

      img { width: 100%; height: 100%; object-fit: cover; }
      .placeholder-icon { color: var(--fw-text-tertiary); }
    }

    .upload-body {
      flex: 1;
      min-width: 0;
    }

    .hidden-input { display: none; }

    .upload-btn {
      padding: 8px 16px;
      border-radius: var(--fw-radius-md);
      border: 1px solid var(--fw-border);
      background: var(--fw-surface-card);
      color: var(--fw-text-primary);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;

      &:hover:not(:disabled) { border-color: var(--fw-primary); color: var(--fw-primary); }
      &:disabled { cursor: not-allowed; }
    }

    .hint {
      margin-top: 6px;
      font-size: 10px;
      color: var(--fw-text-tertiary);
      font-weight: 600;
    }
  `]
})
export class ImageUploadFieldComponent {
  private schoolService = inject(SchoolService);
  private documentEngineService = inject(DocumentEngineService);
  private notificationService = inject(NotificationService);

  @Input() currentUrl: string | null | undefined = null;
  @Input() target: 'logo' | 'cover' = 'logo';
  @Input() aspect: 'square' | 'wide' = 'square';
  @Input() hint = '';
  @Input() disabled = false;

  @Output() uploaded = new EventEmitter<string>();

  isUploading = signal(false);

  readonly Upload = Upload;
  readonly Loader2 = Loader2;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.isUploading.set(true);

    this.schoolService.getBrandingUploadTicket({
      fileName: file.name,
      contentType: file.type,
      target: this.target,
    }).pipe(
      switchMap(ticket =>
        this.documentEngineService.uploadFileDirectly(ticket.uploadUrl, file).pipe(
          map(() => ticket.publicUrl)
        )
      ),
      finalize(() => this.isUploading.set(false))
    ).subscribe({
      next: publicUrl => {
        this.currentUrl = publicUrl;
        this.uploaded.emit(publicUrl);
        this.notificationService.success('Image envoyée avec succès.');
      }
    });
  }
}
