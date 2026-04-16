import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-step-vault',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Vault Documentaire</h1>
        <p>Veuillez charger les pièces justificatives demandées par l'école.</p>
      </div>

      <div class="vault-grid">
        <div *ngFor="let doc of checklist; let i = index" class="vault-card" 
             [class.success]="isUploaded(doc.code)">
          <div class="vault-info">
            <span class="vault-label">{{ doc.name }}</span>
            <span class="vault-meta">{{ doc.mandatory ? 'Requis' : 'Optionnel' }}</span>
          </div>
          <div class="vault-action">
            <input type="file" #fileInput hidden (change)="onFileSelected.emit({code: doc.code, event: $event})">
            <button type="button" class="btn-vault" (click)="fileInput.click()" [disabled]="uploadingDocCode !== null">
              <lucide-icon *ngIf="uploadingDocCode !== doc.code" [name]="Upload" [size]="18"></lucide-icon>
              <lucide-icon *ngIf="uploadingDocCode === doc.code" [name]="RefreshCw" [size]="18" class="animate-spin"></lucide-icon>
              <span>Charger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StepVaultComponent {
  @Input() checklist: any[] = [];
  @Input() application: any;
  @Input() uploadingDocCode: string | null = null;
  @Output() onFileSelected = new EventEmitter<{code: string, event: any}>();

  isUploaded(code: string): boolean {
    return this.application?.documents?.find((d: any) => d.code === code)?.status === 'UPLOADED';
  }

  readonly Upload = Upload;
  readonly RefreshCw = RefreshCw;
}
