import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckCircle, FileText, LucideAngularModule, RefreshCw, Upload, XCircle } from 'lucide-angular';
import { RequiredDocument } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-vault',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Documents</h1>
        <p class="text-slate-500 mt-2">Veuillez joindre les pièces justificatives demandées.</p>
      </div>

      <div class="flex flex-col gap-3">
        <div *ngFor="let doc of documents"
             class="flex items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-colors"
             [class.border-emerald-100]="isSuccess(doc.status)"
             [class.bg-emerald-50]="isSuccess(doc.status)"
             [class.border-red-100]="doc.status === 'REJECTED'"
             [class.bg-red-50]="doc.status === 'REJECTED'"
             [class.border-slate-100]="doc.status === 'MISSING'"
             [class.bg-white]="doc.status === 'MISSING'">

          <!-- Icône + info -->
          <div class="flex items-center gap-4 min-w-0">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                 [class.bg-emerald-100]="isSuccess(doc.status)"
                 [class.text-emerald-600]="isSuccess(doc.status)"
                 [class.bg-red-100]="doc.status === 'REJECTED'"
                 [class.text-red-500]="doc.status === 'REJECTED'"
                 [class.bg-slate-100]="doc.status === 'MISSING'"
                 [class.text-slate-400]="doc.status === 'MISSING'">
              <lucide-icon [name]="docIcon(doc.status)" [size]="18"></lucide-icon>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-slate-800 text-sm truncate">{{ doc.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span *ngIf="doc.mandatory"
                      class="text-[10px] font-extrabold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  Obligatoire
                </span>
                <span class="text-xs font-semibold"
                      [class.text-emerald-600]="isSuccess(doc.status)"
                      [class.text-red-500]="doc.status === 'REJECTED'"
                      [class.text-slate-400]="doc.status === 'MISSING'">
                  {{ statusText(doc.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action upload -->
          <div class="shrink-0">
            <input type="file" #fileInput hidden
                   (change)="onFileChange(doc.code, fileInput)">
            <button type="button"
                    [disabled]="uploadingDocCode !== null || doc.status === 'VERIFIED' || doc.status === 'RECEIVED'"
                    (click)="fileInput.click()"
                    class="flex items-center gap-2 h-9 px-4 rounded-xl border-2 text-xs font-bold transition
                           disabled:opacity-40 disabled:cursor-not-allowed"
                    [class.border-slate-200]="doc.status === 'MISSING'"
                    [class.text-slate-600]="doc.status === 'MISSING'"
                    [class.border-emerald-200]="isSuccess(doc.status)"
                    [class.text-emerald-600]="isSuccess(doc.status)"
                    [class.border-red-200]="doc.status === 'REJECTED'"
                    [class.text-red-500]="doc.status === 'REJECTED'">
              <lucide-icon *ngIf="uploadingDocCode !== doc.code" [name]="Upload" [size]="13"></lucide-icon>
              <lucide-icon *ngIf="uploadingDocCode === doc.code" [name]="RefreshCw" [size]="13" class="animate-spin"></lucide-icon>
              <span>{{ isSuccess(doc.status) ? 'Remplacer' : 'Choisir' }}</span>
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
      UPLOADED: '✓ Téléchargé', RECEIVED: '✓ Reçu', VERIFIED: '✓ Vérifié',
      REJECTED: '✕ Rejeté', MISSING: 'En attente'
    };
    return map[status] ?? status;
  }

  readonly Upload = Upload;
  readonly RefreshCw = RefreshCw;
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;
  readonly XCircle = XCircle;
}
