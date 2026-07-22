import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CheckCircle, FileText, LucideAngularModule, RefreshCw, ShieldCheck, Upload, XCircle} from 'lucide-angular';
import {RequiredDocument} from '../../../../../../core/models/enrollment';
import {FwButtonComponent} from '../../../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-step-vault',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwButtonComponent, FwBadgeComponent],
  template: `
    <div class="animate-fade">
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="ShieldCheck" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">{{ title || 'Pièces justificatives' }}</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          {{ subtitle || 'Veuillez télécharger les documents requis pour finaliser l inscription de élève.' }}
        </p>
      </div>

      <div class="space-y-4">
        <div *ngFor="let doc of documents"
             class="group flex items-center justify-between gap-6 p-6 rounded-3xl border-2 transition-all bg-white"
             [class.border-success-border]="isSuccess(doc.status)"
             [class.bg-success-bg]="isSuccess(doc.status)"
             [class.border-error-border]="doc.status === 'REJECTED'"
             [class.bg-error-bg]="doc.status === 'REJECTED'"
             [class.border-border]="doc.status === 'MISSING'">

          <!-- Icône + info -->
          <div class="flex items-center gap-5 min-w-0">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
                 [class.bg-success-border]="isSuccess(doc.status)"
                 [class.text-success]="isSuccess(doc.status)"
                 [class.bg-error-border]="doc.status === 'REJECTED'"
                 [class.text-error]="doc.status === 'REJECTED'"
                 [class.bg-surface-sunken]="doc.status === 'MISSING'"
                 [class.text-text-tertiary]="doc.status === 'MISSING'">
              <lucide-icon [name]="docIcon(doc.status)" [size]="24"></lucide-icon>
            </div>
            <div class="min-w-0">
              <p class="font-black text-midnight text-lg truncate mb-1">{{ doc.name }}</p>
              <div class="flex items-center gap-3">
                <!-- Badge Obligatoire : Uniquement si manquant ou rejeté -->
                <app-fw-badge *ngIf="doc.mandatory && (doc.status === 'MISSING' || doc.status === 'REJECTED')"
                              status="REQUIRED" labelOverride="Obligatoire" size="xs"></app-fw-badge>

                <!-- Badge de Statut Réel -->
                <app-fw-badge [status]="doc.status === 'MISSING' ? 'DRAFT' : doc.status"
                              [labelOverride]="docStatusLabel(doc.status)"
                              size="xs"></app-fw-badge>
              </div>
              <!-- Message d'erreur explicite pour les docs obligatoires manquants -->
              <p *ngIf="doc.mandatory && doc.status === 'MISSING'" class="fw-error-text mt-2">Ce document est requis pour finaliser l'inscription.</p>
              <p *ngIf="doc.status === 'REJECTED'" class="fw-error-text mt-2 text-error">Document refusé par l'établissement. Veuillez en fournir un nouveau.</p>
            </div>
          </div>

          <!-- Action upload -->
          <div class="shrink-0">
            <input type="file" #fileInput hidden
                   (change)="onFileChange(doc.code, fileInput)">
            <app-fw-button
              (click)="fileInput.click()"
              [disabled]="uploadingDocCode !== null || doc.status === 'PHYSICAL_RECEIVED'"
              [loading]="uploadingDocCode === doc.code"
              [variant]="isSuccess(doc.status) ? 'secondary' : 'primary'"
              size="md"
              [icon]="Upload"
            >
              {{ isSuccess(doc.status) ? 'Remplacer' : 'Choisir le fichier' }}
            </app-fw-button>
          </div>
        </div>

        <!-- 💡 Aide Upload Standardisée -->
        <div class="mt-12 p-6 bg-surface-sunken rounded-3xl border border-border flex items-start gap-5">
          <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <lucide-icon [name]="FileText" [size]="18" class="text-text-tertiary"></lucide-icon>
          </div>
          <div class="text-xs text-text-secondary leading-relaxed">
            <p class="font-bold text-midnight text-sm mb-1 text-uppercase tracking-wider">Formats & Sécurité</p>
            <p class="font-medium">Formats acceptés : <strong class="text-midnight">PDF, JPG, PNG</strong> (Max 5Mo).</p>
            <p class="mt-1">Assurez-vous que les documents sont lisibles et complets avant de les soumettre.</p>
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
  @Input() title?: string;
  @Input() subtitle?: string;
  @Output() onFileSelected = new EventEmitter<{ code: string; file: File }>();

  onFileChange(code: string, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (file) this.onFileSelected.emit({ code, file });
    input.value = '';
  }

  isSuccess(status: string): boolean {
    return status === 'UPLOADED' || status === 'PHYSICAL_RECEIVED';
  }

  docIcon(status: string): any {
    if (this.isSuccess(status)) return CheckCircle;
    if (status === 'REJECTED') return XCircle;
    return FileText;
  }

  docStatusLabel(status: string): string {
    switch (status) {
      case 'MISSING':          return 'Absent';
      case 'UPLOADED':         return 'Numérisée';
      case 'PHYSICAL_RECEIVED': return 'Reçue';
      case 'REJECTED':         return 'Refusé';
      default: return status;
    }
  }

  readonly Upload = Upload;
  readonly RefreshCw = RefreshCw;
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;
  readonly XCircle = XCircle;
  readonly ShieldCheck = ShieldCheck;
}
