import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, RefreshCw, CheckCircle, FileText, XCircle } from 'lucide-angular';
import { RequiredDocument } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-vault',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Coffre-fort Numérique</h1>
        <p>Veuillez charger les pièces justificatives demandées pour l'élève.</p>
      </div>

      <div class="vault-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let doc of documents" class="vault-card p-5 border-2 rounded-2xl flex items-center justify-between transition-all"
             [class.border-emerald-100]="doc.status === 'UPLOADED' || doc.status === 'RECEIVED' || doc.status === 'VERIFIED'"
             [class.bg-emerald-50]="doc.status === 'UPLOADED' || doc.status === 'RECEIVED' || doc.status === 'VERIFIED'"
             [class.border-slate-100]="doc.status === 'MISSING'"
             [class.bg-white]="doc.status === 'MISSING'"
             [class.border-red-100]="doc.status === 'REJECTED'"
             [class.bg-red-50]="doc.status === 'REJECTED'">
          
          <div class="flex items-center gap-4">
            <div class="vault-icon w-10 h-10 rounded-full flex items-center justify-center"
                 [class.bg-emerald-100]="doc.status === 'UPLOADED' || doc.status === 'RECEIVED' || doc.status === 'VERIFIED'"
                 [class.text-emerald-600]="doc.status === 'UPLOADED' || doc.status === 'RECEIVED' || doc.status === 'VERIFIED'"
                 [class.bg-slate-100]="doc.status === 'MISSING'"
                 [class.text-slate-400]="doc.status === 'MISSING'"
                 [class.bg-red-100]="doc.status === 'REJECTED'"
                 [class.text-red-600]="doc.status === 'REJECTED'">
              <lucide-icon [name]="getIcon(doc.status)" [size]="20"></lucide-icon>
            </div>

            <div class="vault-info flex flex-col">
              <span class="vault-label font-bold text-slate-800">{{ doc.name }}</span>
              <div class="flex items-center gap-2">
                <span *ngIf="doc.mandatory" class="text-[10px] font-extrabold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Obligatoire</span>
                <span class="text-xs font-medium" 
                      [class.text-emerald-600]="doc.status === 'UPLOADED' || doc.status === 'RECEIVED' || doc.status === 'VERIFIED'"
                      [class.text-slate-400]="doc.status === 'MISSING'"
                      [class.text-red-600]="doc.status === 'REJECTED'">
                  {{ getStatusText(doc.status) }}
                </span>
              </div>
            </div>
          </div>

          <div class="vault-action">
            <input type="file" #fileInput hidden (change)="onFileSelected.emit({code: doc.code, event: $event})">
            <button type="button" class="btn-vault h-10 px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                    [disabled]="uploadingDocCode !== null || doc.status === 'VERIFIED' || doc.status === 'RECEIVED'"
                    [class.bg-white]="doc.status === 'MISSING' || doc.status === 'REJECTED' || doc.status === 'UPLOADED'"
                    [class.border-2]="doc.status === 'MISSING' || doc.status === 'REJECTED' || doc.status === 'UPLOADED'"
                    [class.border-slate-200]="doc.status === 'MISSING'"
                    [class.text-slate-600]="doc.status === 'MISSING'"
                    [class.border-emerald-200]="doc.status === 'UPLOADED'"
                    [class.text-emerald-600]="doc.status === 'UPLOADED'"
                    [class.border-red-200]="doc.status === 'REJECTED'"
                    [class.text-red-600]="doc.status === 'REJECTED'"
                    [class.opacity-50]="doc.status === 'VERIFIED' || doc.status === 'RECEIVED'"
                    (click)="fileInput.click()">
              <lucide-icon *ngIf="uploadingDocCode !== doc.code" [name]="Upload" [size]="16"></lucide-icon>
              <lucide-icon *ngIf="uploadingDocCode === doc.code" [name]="RefreshCw" [size]="16" class="animate-spin"></lucide-icon>
              <span>{{ doc.status === 'MISSING' ? 'Choisir' : 'Remplacer' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StepVaultComponent {
  @Input() documents: RequiredDocument[] = [];
  @Input() uploadingDocCode: string | null = null;
  @Output() onFileSelected = new EventEmitter<{code: string, event: any}>();

  getIcon(status: string) {
    switch (status) {
      case 'UPLOADED':
      case 'RECEIVED':
      case 'VERIFIED':
        return this.CheckCircle;
      case 'REJECTED':
        return this.XCircle;
      default:
        return this.FileText;
    }
  }

  getStatusText(status: string) {
    switch (status) {
      case 'UPLOADED': return '✓ Téléchargé';
      case 'RECEIVED': return '✓ Reçu';
      case 'VERIFIED': return '✓ Vérifié';
      case 'REJECTED': return '✕ Rejeté';
      default: return 'En attente';
    }
  }

  readonly Upload = Upload;
  readonly RefreshCw = RefreshCw;
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;
  readonly XCircle = XCircle;
}
