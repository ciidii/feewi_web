import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckCircle, CircleAlert, FilePlus, LucideAngularModule, Pencil, User } from 'lucide-angular';
import { Admission } from '../../../../../../core/models/enrollment/entities';

@Component({
  selector: 'app-step-hub',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Dossiers des enfants</h1>
        <p class="text-slate-500 mt-2">
          Complétez le dossier de chaque enfant, puis soumettez l'ensemble.
        </p>
      </div>

      <!-- Liste des enfants -->
      <div class="flex flex-col gap-3 mb-8">
        <div *ngFor="let adm of admissions"
             class="flex items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-colors"
             [class.border-emerald-100]="isReady(adm)"
             [class.bg-emerald-50]="isReady(adm)"
             [class.border-slate-100]="!isReady(adm)"
             [class.bg-white]="!isReady(adm)">

          <!-- Identité enfant -->
          <div class="flex items-center gap-4 min-w-0">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                 [class.bg-emerald-100]="isReady(adm)"
                 [class.text-emerald-600]="isReady(adm)"
                 [class.bg-slate-100]="!isReady(adm)"
                 [class.text-slate-400]="!isReady(adm)">
              <lucide-icon [name]="User" [size]="18"></lucide-icon>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-slate-800 truncate">
                {{ adm.identity.firstName }} {{ adm.identity.lastName }}
              </p>
              <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                <span class="text-xs font-semibold text-slate-400">{{ levelName(adm) }}</span>
                <span class="flex items-center gap-1 text-xs font-bold"
                      [class.text-emerald-600]="isReady(adm)"
                      [class.text-amber-500]="!isReady(adm)">
                  <lucide-icon [name]="isReady(adm) ? CheckCircle : CircleAlert" [size]="12"></lucide-icon>
                  {{ isReady(adm) ? 'Prêt' : 'Incomplet' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action -->
          <button type="button"
                  (click)="editChild.emit(adm)"
                  class="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border-2 text-xs font-bold transition
                         border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 bg-white">
            <lucide-icon [name]="Pencil" [size]="13"></lucide-icon>
            {{ isReady(adm) ? 'Modifier' : 'Compléter' }}
          </button>
        </div>

        <!-- État vide -->
        <div *ngIf="!admissions.length"
             class="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p class="text-sm font-semibold text-slate-400">Aucun enfant ajouté pour le moment.</p>
        </div>
      </div>

      <!-- Ajouter un enfant -->
      <button type="button"
              (click)="addChild.emit()"
              class="w-full flex items-center justify-center gap-2.5 h-14 rounded-2xl border-2 border-dashed
                     border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition mb-10">
        <lucide-icon [name]="FilePlus" [size]="18"></lucide-icon>
        Ajouter un autre enfant
      </button>

      <!-- Séparateur -->
      <div class="border-t border-slate-100 pt-8" *ngIf="admissions.length > 0">
        <div *ngIf="hasIncomplete()" class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6">
          <lucide-icon [name]="CircleAlert" [size]="18" class="text-amber-500 mt-0.5 shrink-0"></lucide-icon>
          <p class="text-sm font-semibold text-amber-700">
            Certains dossiers sont incomplets. Complétez-les avant de soumettre.
          </p>
        </div>

        <button type="button"
                (click)="submitAll.emit()"
                [disabled]="hasIncomplete()"
                class="w-full flex items-center justify-center gap-2.5 h-14 bg-slate-900 text-white font-bold text-sm
                       rounded-2xl shadow-lg transition-all hover:bg-blue-600 hover:-translate-y-0.5
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
          <lucide-icon [name]="CheckCircle" [size]="18"></lucide-icon>
          Soumettre le dossier famille ({{ admissions.length }} enfant{{ admissions.length > 1 ? 's' : '' }})
        </button>
      </div>
    </div>
  `
})
export class StepHubComponent {
  @Input() admissions: Admission[] = [];
  @Input() allLevels: any[] = [];
  @Output() editChild  = new EventEmitter<Admission>();
  @Output() addChild   = new EventEmitter<void>();
  @Output() submitAll  = new EventEmitter<void>();

  isReady(adm: Admission): boolean {
    const mandatoryDocs = adm.documents?.filter(d => d.mandatory) ?? [];
    return mandatoryDocs.length > 0
      ? mandatoryDocs.every(d => d.status === 'UPLOADED' || d.status === 'RECEIVED' || d.status === 'VERIFIED')
      : !!adm.identity?.firstName;
  }

  hasIncomplete(): boolean {
    return this.admissions.some(a => !this.isReady(a));
  }

  levelName(adm: Admission): string {
    return this.allLevels.find(l => l.id === adm.schooling?.levelId)?.name ?? adm.schooling?.levelId ?? '';
  }

  readonly User = User;
  readonly CheckCircle = CheckCircle;
  readonly CircleAlert = CircleAlert;
  readonly FilePlus = FilePlus;
  readonly Pencil = Pencil;
}
