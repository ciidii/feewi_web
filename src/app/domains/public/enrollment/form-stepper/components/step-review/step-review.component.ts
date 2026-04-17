import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle, User, Users, HeartPulse, LayoutGrid, FileText, Info } from 'lucide-angular';
import { Admission } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Validation Finale</h1>
        <p>Veuillez contrôler les informations avant l'envoi au secrétariat.</p>
      </div>

      <div class="review-sections space-y-6">
        <!-- Section Famille -->
        <div class="review-card-premium p-6 border-2 border-slate-100 rounded-2xl bg-white">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <lucide-icon [name]="Users" [size]="18"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800">Responsable Légal</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div class="row flex flex-col">
              <span class="label text-xs font-bold text-slate-400 uppercase tracking-wider">Identité</span>
              <span class="value font-semibold text-slate-700">{{ family.primaryGuardian.firstName }} {{ family.primaryGuardian.lastName }}</span>
            </div>
            <div class="row flex flex-col">
              <span class="label text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</span>
              <span class="value font-semibold text-slate-700">{{ family.primaryGuardian.email }} / {{ family.primaryGuardian.phone }}</span>
            </div>
          </div>
        </div>

        <!-- Section Élève -->
        <div class="review-card-premium p-6 border-2 border-slate-100 rounded-2xl bg-white">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <lucide-icon [name]="User" [size]="18"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800">Candidat</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div class="row flex flex-col">
              <span class="label text-xs font-bold text-slate-400 uppercase tracking-wider">Élève</span>
              <span class="value font-semibold text-slate-700">{{ identity.firstName }} {{ identity.lastName }}</span>
            </div>
            <div class="row flex flex-col">
              <span class="label text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau visé</span>
              <span class="value font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm w-fit">{{ levelName || schooling.levelId }}</span>
            </div>
          </div>
        </div>

        <!-- Section Services (sélections locales, avant soumission) -->
        <div class="review-card-premium p-6 border-2 border-slate-100 rounded-2xl bg-white" *ngIf="pendingServices?.length">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <lucide-icon [name]="LayoutGrid" [size]="18"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800">Services Souscrits</h3>
          </div>
          <div class="flex flex-wrap gap-2">
            <div *ngFor="let sub of pendingServices" class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <span class="text-sm font-bold text-slate-700">{{ sub.serviceCode }}</span>
              <span *ngIf="sub.optionCode" class="text-xs text-slate-400">• {{ sub.optionCode }}</span>
            </div>
          </div>
        </div>

        <!-- Section Documents -->
        <div class="review-card-premium p-6 border-2 border-slate-100 rounded-2xl bg-white">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <lucide-icon [name]="FileText" [size]="18"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800">Documents</h3>
          </div>
          <div class="space-y-2">
            <div *ngFor="let doc of admission?.documents" class="flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ doc.name }}</span>
              <span class="font-bold" [class.text-emerald-600]="doc.status === 'UPLOADED'" [class.text-red-500]="doc.status === 'MISSING'">
                {{ doc.status === 'UPLOADED' ? 'Chargé' : 'Manquant' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="legal-consent mt-8 p-6 bg-slate-900 text-white rounded-3xl">
        <div class="legal-text text-sm opacity-80 mb-6 leading-relaxed" *ngIf="legalText">{{ legalText }}</div>
        <div class="legal-text text-sm opacity-80 mb-6 leading-relaxed" *ngIf="!legalText">
          Je certifie sur l'honneur l'exactitude des informations fournies dans ce dossier d'inscription. 
          Toute fausse déclaration pourra entraîner l'annulation de la candidature.
        </div>
        
        <label class="premium-checkbox flex items-center gap-4 cursor-pointer">
          <div class="relative w-6 h-6">
            <input type="checkbox" [(ngModel)]="consent.checked" class="peer absolute inset-0 opacity-0 cursor-pointer">
            <div class="checkmark w-6 h-6 rounded-lg border-2 border-white/30 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center">
              <lucide-icon [name]="CheckCircle" [size]="16" class="text-white opacity-0 peer-checked:opacity-100"></lucide-icon>
            </div>
          </div>
          <span class="font-bold select-none">J'accepte les conditions et je valide mon dossier</span>
        </label>
      </div>
    </div>
  `,
  styles: [`
    .review-sections { display: flex; flex-direction: column; gap: 1rem; }
    .row .label { color: #64748b; margin-bottom: 2px; }
    .row .value { color: #0f172a; }
  `]
})
export class StepReviewComponent {
  @Input() family: any;
  @Input() identity: any;
  @Input() schooling: any;
  @Input() levelName: string = '';
  @Input() admission: Admission | null = null;
  @Input() legalText: string = '';
  @Input() consent: { checked: boolean } = { checked: false };
  @Input() pendingServices: any[] = [];

  readonly User = User;
  readonly Users = Users;
  readonly HeartPulse = HeartPulse;
  readonly LayoutGrid = LayoutGrid;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly Info = Info;
}
