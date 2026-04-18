import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckCircle, FileText, LucideAngularModule, RefreshCw, Upload, XCircle, ShieldCheck } from 'lucide-angular';
import { RequiredDocument } from '../../../../../../core/models/enrollment';
import { FwButtonComponent } from '../../../../../../shared/components/button/button.component';
import { FwBadgeComponent } from '../../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-step-vault',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwButtonComponent, FwBadgeComponent],
  template: `
    <div class="animate-fade">
      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-alpha text-primary rounded-xl mb-4">
          <lucide-icon [name]="ShieldCheck" [size]="24"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight">Pièces justificatives</h1>
        <p class="text-sm text-text-secondary font-medium mt-2 max-w-lg">
          Veuillez télécharger les documents requis pour finaliser l'inscription de l'élève.
        </p>
      </div>

      <div class="space-y-4">
        <div *ngFor="let doc of documents"
             class="group flex items-center justify-between gap-6 p-6 rounded-2xl border-2 transition-all bg-white"
             [class.border-success-border]="isSuccess(doc.status)"
             [class.bg-success-bg]="isSuccess(doc.status)"
             [class.border-error-border]="doc.status === 'REJECTED'"
             [class.bg-error-bg]="doc.status === 'REJECTED'"
             [class.border-border]="doc.status === 'MISSING'">

          <!-- Icône + info -->
          <div class="flex items-center gap-5 min-w-0">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                 [class.bg-success-border]="isSuccess(doc.status)"
                 [class.text-success]="isSuccess(doc.status)"
                 [class.bg-error-border]="doc.status === 'REJECTED'"
                 [class.text-error]="doc.status === 'REJECTED'"
                 [class.bg-surface-sunken]="doc.status === 'MISSING'"
                 [class.text-text-tertiary]="doc.status === 'MISSING'">
              <lucide-icon [name]="docIcon(doc.status)" [size]="24"></lucide-icon>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-midnight text-base truncate mb-1">{{ doc.name }}</p>
              <div class="flex items-center gap-3">
                <app-fw-badge *ngIf="doc.mandatory" status="SUBMITTED" size="xs"></app-fw-badge>
                <span class="text-[10px] font-black uppercase tracking-widest"
                      [class.text-success]="isSuccess(doc.status)"
                      [class.text-error]="doc.status === 'REJECTED'"
                      [class.text-text-tertiary]="doc.status === 'MISSING'">
                  {{ statusText(doc.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action upload -->
          <div class="shrink-0">
            <input type="file" #fileInput hidden
                   (change)="onFileChange(doc.code, fileInput)">
            <app-fw-button 
              (click)="fileInput.click()"
              [disabled]="uploadingDocCode !== null || doc.status === 'VERIFIED' || doc.status === 'RECEIVED'"
              [loading]="uploadingDocCode === doc.code"
              [variant]="isSuccess(doc.status) ? 'secondary' : 'primary'"
              size="sm"
              [icon]="Upload"
            >
              {{ isSuccess(doc.status) ? 'Remplacer' : 'Choisir' }}
            </app-fw-button>
          </div>
        </div>

        <!-- Aide Upload -->
        <div class="mt-8 p-6 bg-surface-sunken rounded-2xl border border-border flex items-start gap-4">
          <lucide-icon [name]="FileText" [size]="18" class="text-text-tertiary mt-0.5"></lucide-icon>
          <div class="text-xs text-text-secondary leading-relaxed">
            <p class="font-bold text-midnight mb-1">Formats acceptés : PDF, JPG, PNG (Max 5Mo)</p>
            <p>Assurez-vous que les documents sont lisibles et complets avant de les soumettre.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StepVaultComponent {
  @Input() documents: RequiredDocument[] = [];
  @Input() uploadingDocCode: string | null = null;
  @Output() onFileSelected = new EventEmitter<{ code: string; file: File }>();

  onFileChange(code: string, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (file) this.onFileSelected.emit({ code, file });
    input.value = '';
  }

  isSuccess(status: string): boolean {
    return status === 'UPLOADED' || status === 'RECEIVED' || status === 'VERIFIED';
  }

  docIcon(status: string): any {
    if (this.isSuccess(status)) return CheckCircle;
    if (status === 'REJECTED') return XCircle;
    return FileText;
  }

  statusText(status: string): string {
    const map: Record<string, string> = {
      UPLOADED: 'Téléchargé', RECEIVED: 'Reçu', VERIFIED: 'Vérifié',
      REJECTED: 'Refusé', MISSING: 'Manquant'
    };
    return map[status] ?? status;
  }

  readonly Upload = Upload;
  readonly RefreshCw = RefreshCw;
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;
  readonly XCircle = XCircle;
  readonly ShieldCheck = ShieldCheck;
}
