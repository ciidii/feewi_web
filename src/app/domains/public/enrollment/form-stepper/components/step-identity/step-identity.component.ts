import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FieldConfig } from '../../../../../../core/models/enrollment';

const INPUT_CLS = 'w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition';
const LABEL_CLS = 'block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2';

@Component({
  selector: 'app-step-identity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">L'élève</h1>
        <p class="text-slate-500 mt-2">Informations d'état civil et vœu de scolarité.</p>
      </div>

      <div class="grid grid-cols-2 gap-6">

        <!-- Niveau scolaire -->
        <div class="col-span-2">
          <label class="${LABEL_CLS}">{{ coreLabel('levelId') }}</label>
          <select [(ngModel)]="schooling.levelId"
                  (change)="onLevelChange.emit(schooling.levelId)"
                  class="${INPUT_CLS} border-blue-200 ring-2 ring-blue-500/10">
            <option value="">Sélectionnez un niveau...</option>
            <option *ngFor="let level of availableLevels" [value]="level.id">{{ level.name }}</option>
          </select>
        </div>

        <!-- Prénom -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('firstName') }}</label>
          <input type="text" [(ngModel)]="identity.firstName" class="${INPUT_CLS}">
        </div>

        <!-- Nom -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('lastName') }}</label>
          <input type="text" [(ngModel)]="identity.lastName" class="${INPUT_CLS}">
        </div>

        <!-- Genre -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('gender') }}</label>
          <select [(ngModel)]="identity.gender" class="${INPUT_CLS}">
            <option value="MALE">Masculin</option>
            <option value="FEMALE">Féminin</option>
          </select>
        </div>

        <!-- Date de naissance -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('birthDate') }}</label>
          <input type="date" [(ngModel)]="identity.birthDate" class="${INPUT_CLS}">
        </div>

        <!-- Lieu de naissance -->
        <div>
          <label class="${LABEL_CLS}">{{ coreLabel('birthPlace') }}</label>
          <input type="text" [(ngModel)]="identity.birthPlace"
                 class="${INPUT_CLS}" placeholder="Ville de naissance">
        </div>

        <!-- Champs dynamiques -->
        <ng-container *ngFor="let field of customFields">
          <div [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="${LABEL_CLS}">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="text-red-400 ml-0.5">*</span>
            </label>
            <ng-container [ngSwitch]="field.type">
              <select *ngSwitchCase="'SELECT'"
                      [(ngModel)]="identity.customFields[field.name]"
                      class="${INPUT_CLS}">
                <option value="">Sélectionner...</option>
                <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
              </select>
              <textarea *ngSwitchCase="'TEXTAREA'"
                        [(ngModel)]="identity.customFields[field.name]"
                        rows="3"
                        class="${INPUT_CLS} py-3 h-auto"></textarea>
              <input *ngSwitchCase="'DATE'" type="date"
                     [(ngModel)]="identity.customFields[field.name]"
                     class="${INPUT_CLS}">
              <input *ngSwitchDefault type="text"
                     [(ngModel)]="identity.customFields[field.name]"
                     class="${INPUT_CLS}">
            </ng-container>
          </div>
        </ng-container>

      </div>
    </div>
  `
})
export class StepIdentityComponent {
  @Input() identity: any;
  @Input() schooling: any;
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Input() customFields: FieldConfig[] = [];
  @Input() availableLevels: any[] = [];
  @Output() onLevelChange = new EventEmitter<string>();

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }
}
