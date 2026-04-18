import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Info, LucideAngularModule } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

const INPUT_CLS = 'w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition';
const LABEL_CLS = 'block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2';

@Component({
  selector: 'app-step-medical',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Santé</h1>
        <p class="text-slate-500 mt-2">Ces données sont strictement confidentielles.</p>
      </div>

      <div *ngIf="customFields.length > 0; else noFields" class="grid grid-cols-2 gap-6">
        <ng-container *ngFor="let field of customFields">
          <div [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="${LABEL_CLS}">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="text-red-400 ml-0.5">*</span>
            </label>
            <ng-container [ngSwitch]="field.type">
              <select *ngSwitchCase="'SELECT'"
                      [(ngModel)]="medical.customFields[field.name]"
                      class="${INPUT_CLS}">
                <option value="">—</option>
                <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
              </select>
              <textarea *ngSwitchCase="'TEXTAREA'"
                        [(ngModel)]="medical.customFields[field.name]"
                        rows="3"
                        class="${INPUT_CLS} py-3 h-auto"></textarea>
              <input *ngSwitchCase="'DATE'" type="date"
                     [(ngModel)]="medical.customFields[field.name]"
                     class="${INPUT_CLS}">
              <input *ngSwitchDefault type="text"
                     [(ngModel)]="medical.customFields[field.name]"
                     class="${INPUT_CLS}">
            </ng-container>
          </div>
        </ng-container>
      </div>

      <ng-template #noFields>
        <div class="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <lucide-icon [name]="Info" [size]="20" class="text-slate-400 shrink-0"></lucide-icon>
          <p class="text-sm font-semibold text-slate-500">
            Aucune information médicale requise par l'établissement.
          </p>
        </div>
      </ng-template>
    </div>
  `
})
export class StepMedicalComponent {
  @Input() medical: any;
  @Input() customFields: FieldConfig[] = [];

  readonly Info = Info;
}
