import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FieldConfig } from '../../../../../../core/models/enrollment';

const INPUT_CLS = 'w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition';
const LABEL_CLS = 'block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2';

// Champs optionnels "preset" qui correspondent à des propriétés top-level du Guardian
// (pas dans customFields — le backend les attend au niveau racine)
const GUARDIAN_TOP_LEVEL: ReadonlySet<string> = new Set(['email']);

@Component({
  selector: 'app-step-family',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Responsable légal</h1>
        <p class="text-slate-500 mt-2">Commençons par identifier le tuteur légal de l'enfant.</p>
      </div>

      <div class="grid grid-cols-2 gap-6">

        <!-- Lien de parenté -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('relation') }}</label>
          <select [(ngModel)]="data.primaryGuardian.relation" class="${INPUT_CLS}">
            <option value="FATHER">Père</option>
            <option value="MOTHER">Mère</option>
            <option value="UNCLE">Oncle</option>
            <option value="AUNT">Tante</option>
            <option value="GRANDPARENT">Grand-parent</option>
            <option value="GUARDIAN">Tuteur légal</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <!-- Nom -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('lastName') }}</label>
          <input type="text" [(ngModel)]="data.primaryGuardian.lastName" class="${INPUT_CLS}">
        </div>

        <!-- Prénom -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('firstName') }}</label>
          <input type="text" [(ngModel)]="data.primaryGuardian.firstName" class="${INPUT_CLS}">
        </div>

        <!-- Téléphone -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('phone') }}</label>
          <input type="tel" [(ngModel)]="data.primaryGuardian.phone" class="${INPUT_CLS}">
        </div>

        <!-- Champs dynamiques (preset + custom) -->
        <ng-container *ngFor="let field of customFields">
          <div [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="${LABEL_CLS}">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="text-red-400 ml-0.5">*</span>
            </label>

            <!-- Champ top-level (ex: email) -->
            <ng-container *ngIf="isTopLevel(field.name); else customField">
              <input [type]="field.name === 'email' ? 'email' : 'text'"
                     [(ngModel)]="data.primaryGuardian[field.name]"
                     class="${INPUT_CLS}">
            </ng-container>

            <!-- Champ customFields -->
            <ng-template #customField>
              <ng-container [ngSwitch]="field.type">
                <select *ngSwitchCase="'SELECT'"
                        [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                        class="${INPUT_CLS}">
                  <option value="">Sélectionner...</option>
                  <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                </select>
                <textarea *ngSwitchCase="'TEXTAREA'"
                          [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                          rows="3"
                          class="${INPUT_CLS} py-3 h-auto"></textarea>
                <input *ngSwitchCase="'DATE'" type="date"
                       [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                       class="${INPUT_CLS}">
                <input *ngSwitchDefault type="text"
                       [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                       class="${INPUT_CLS}">
              </ng-container>
            </ng-template>
          </div>
        </ng-container>

      </div>
    </div>
  `
})
export class StepFamilyComponent {
  @Input() data: any;
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Input() customFields: FieldConfig[] = [];

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }

  isTopLevel(name: string): boolean {
    return GUARDIAN_TOP_LEVEL.has(name);
  }
}
