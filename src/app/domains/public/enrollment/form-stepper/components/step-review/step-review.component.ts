import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckCircle, FileText, LayoutGrid, LucideAngularModule, User, Users } from 'lucide-angular';
import { Admission } from '../../../../../../core/models/enrollment/entities';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Validation finale</h1>
        <p class="text-slate-500 mt-2">Vérifiez l'ensemble du dossier avant l'envoi au secrétariat.</p>
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

        <!-- Un bloc par enfant -->
        <div *ngFor="let adm of admissions; let i = index"
             class="p-5 rounded-2xl border border-slate-100 bg-white">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <lucide-icon [name]="User" [size]="15"></lucide-icon>
            </div>
            <h3 class="font-bold text-slate-800 text-sm">
              Enfant {{ i + 1 }} — {{ adm.identity.firstName }} {{ adm.identity.lastName }}
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <!-- Niveau -->
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Niveau visé</p>
              <span class="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg">
                {{ levelName(adm) }}
              </span>
            </div>

            <!-- Documents -->
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Documents</p>
              <div class="flex flex-col gap-1">
                <div *ngFor="let doc of adm.documents" class="flex justify-between text-xs">
                  <span class="text-slate-600">{{ doc.name }}</span>
                  <span class="font-bold"
                        [class.text-emerald-600]="isDocOk(doc.status)"
                        [class.text-red-500]="!isDocOk(doc.status)">
                    {{ isDocOk(doc.status) ? '✓' : '—' }}
                  </span>
                </div>
                <p *ngIf="!adm.documents?.length" class="text-xs text-slate-400">Aucun document requis</p>
              </div>
            </div>

            <!-- Services -->
            <div *ngIf="adm.subscriptions?.length" class="col-span-2">
              <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Services</p>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let sub of adm.subscriptions"
                      class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                  {{ sub.serviceCode }}<span *ngIf="sub.optionCode"> · {{ sub.optionCode }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Consentement légal -->
      <div class="mt-8 p-6 bg-slate-900 rounded-3xl">
        <p *ngIf="legalText" class="text-sm text-white/70 leading-relaxed mb-5">{{ legalText }}</p>
        <p *ngIf="!legalText" class="text-sm text-white/70 leading-relaxed mb-5">
          Je certifie sur l'honneur l'exactitude des informations fournies.
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
          <span class="text-sm font-bold text-white">J'accepte les conditions et je valide le dossier</span>
        </label>
      </div>
    </div>
  `
})
export class StepReviewComponent {
  @Input() family: any;
  @Input() admissions: Admission[] = [];
  @Input() allLevels: any[] = [];
  @Input() legalText = '';
  @Input() consent: { checked: boolean } = { checked: false };

  levelName(adm: Admission): string {
    return this.allLevels.find(l => l.id === adm.schooling?.levelId)?.name ?? adm.schooling?.levelId ?? '';
  }

  isDocOk(status: string): boolean {
    return ['UPLOADED', 'RECEIVED', 'VERIFIED'].includes(status);
  }

  readonly Users = Users;
  readonly User = User;
  readonly LayoutGrid = LayoutGrid;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
}
