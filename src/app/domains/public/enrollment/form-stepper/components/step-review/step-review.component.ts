import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckCircle, FileText, HeartPulse, LayoutGrid, LucideAngularModule, User, Users } from 'lucide-angular';
import { Admission } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Validation finale</h1>
        <p class="text-slate-500 mt-2">Vérifiez les informations avant l'envoi au secrétariat.</p>
      </div>

      <div class="flex flex-col gap-4">

        <!-- Responsable légal -->
        <div class="p-5 rounded-2xl border border-slate-100 bg-white">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <lucide-icon [name]="Users" [size]="15"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800 text-sm">Responsable légal</h3>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Identité</p>
              <p class="font-semibold text-slate-700">{{ family.primaryGuardian.firstName }} {{ family.primaryGuardian.lastName }}</p>
            </div>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Contact</p>
              <p class="font-semibold text-slate-700">{{ family.primaryGuardian.phone }}</p>
              <p class="text-slate-500 text-xs">{{ family.primaryGuardian.email }}</p>
            </div>
          </div>
        </div>

        <!-- Élève -->
        <div class="p-5 rounded-2xl border border-slate-100 bg-white">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <lucide-icon [name]="User" [size]="15"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800 text-sm">Candidat</h3>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Élève</p>
              <p class="font-semibold text-slate-700">{{ identity.firstName }} {{ identity.lastName }}</p>
            </div>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Niveau visé</p>
              <span class="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg">
                {{ levelName || schooling.levelId }}
              </span>
            </div>
          </div>
        </div>

        <!-- Services souscrits -->
        <div *ngIf="pendingServices?.length" class="p-5 rounded-2xl border border-slate-100 bg-white">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <lucide-icon [name]="LayoutGrid" [size]="15"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800 text-sm">Services souscrits</h3>
          </div>
          <div class="flex flex-wrap gap-2">
            <div *ngFor="let sub of pendingServices"
                 class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="text-xs font-bold text-slate-700">{{ sub.serviceCode }}</span>
              <span *ngIf="sub.optionCode" class="text-xs text-slate-400">· {{ sub.optionCode }}</span>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div class="p-5 rounded-2xl border border-slate-100 bg-white">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <lucide-icon [name]="FileText" [size]="15"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800 text-sm">Documents</h3>
          </div>
          <div *ngIf="admission?.documents?.length; else noDocs" class="flex flex-col gap-2">
            <div *ngFor="let doc of admission?.documents"
                 class="flex items-center justify-between text-xs">
              <span class="text-slate-600 font-medium">{{ doc.name }}</span>
              <span class="font-bold"
                    [class.text-emerald-600]="doc.status === 'UPLOADED' || doc.status === 'RECEIVED' || doc.status === 'VERIFIED'"
                    [class.text-red-500]="doc.status === 'MISSING'"
                    [class.text-red-400]="doc.status === 'REJECTED'">
                {{ docStatusText(doc.status) }}
              </span>
            </div>
          </div>
          <ng-template #noDocs>
            <p class="text-xs text-slate-400 font-medium">Aucun document requis.</p>
          </ng-template>
        </div>

      </div>

      <!-- Consentement légal -->
      <div class="mt-8 p-6 bg-slate-900 rounded-3xl">
        <p *ngIf="legalText" class="text-sm text-white/70 leading-relaxed mb-5">{{ legalText }}</p>
        <p *ngIf="!legalText" class="text-sm text-white/70 leading-relaxed mb-5">
          Je certifie sur l'honneur l'exactitude des informations fournies dans ce dossier d'inscription.
          Toute fausse déclaration pourra entraîner l'annulation de la candidature.
        </p>

        <label class="flex items-center gap-3 cursor-pointer">
          <div class="relative w-5 h-5 shrink-0">
            <input type="checkbox" [(ngModel)]="consent.checked"
                   class="peer absolute inset-0 opacity-0 cursor-pointer w-5 h-5">
            <div class="w-5 h-5 rounded-md border-2 border-white/30 transition-all
                        peer-checked:bg-blue-500 peer-checked:border-blue-500
                        flex items-center justify-center">
              <lucide-icon *ngIf="consent.checked" [name]="CheckCircle" [size]="13" class="text-white"></lucide-icon>
            </div>
          </div>
          <span class="text-sm font-bold text-white">
            J'accepte les conditions et je valide mon dossier
          </span>
        </label>
      </div>
    </div>
  `
})
export class StepReviewComponent {
  @Input() family: any;
  @Input() identity: any;
  @Input() schooling: any;
  @Input() levelName = '';
  @Input() admission: Admission | null = null;
  @Input() legalText = '';
  @Input() consent: { checked: boolean } = { checked: false };
  @Input() pendingServices: any[] = [];

  docStatusText(status: string): string {
    return ({ UPLOADED: '✓ Chargé', RECEIVED: '✓ Reçu', VERIFIED: '✓ Vérifié', REJECTED: '✕ Rejeté', MISSING: '— Manquant' } as Record<string, string>)[status] ?? status;
  }

  readonly Users = Users;
  readonly User = User;
  readonly HeartPulse = HeartPulse;
  readonly LayoutGrid = LayoutGrid;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
}
