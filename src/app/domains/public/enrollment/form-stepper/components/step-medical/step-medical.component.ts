import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeartPulse, LucideAngularModule } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-medical',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade">
      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-alpha text-primary rounded-xl mb-4">
          <lucide-icon [name]="HeartPulse" [size]="24"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight">Santé & Bien-être</h1>
        <p class="text-sm text-text-secondary font-medium mt-2 max-w-lg">
          Ces informations sont strictement confidentielles et ne seront accessibles qu'au personnel habilité.
        </p>
        <div *ngIf="instruction" class="mt-4 px-4 py-3 bg-primary-alpha/10 rounded-xl border border-primary-alpha text-sm text-text-secondary">
          {{ instruction }}
        </div>
      </div>

      <div *ngIf="customFields.length > 0; else noFields" class="grid grid-cols-2 gap-x-8 gap-y-2">
        <ng-container *ngFor="let field of customFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>
            <ng-container [ngSwitch]="field.type">
              <select *ngSwitchCase="'SELECT'"
                      [(ngModel)]="medical.customFields[field.name]"
                      class="fw-input">
                <option value="">Sélectionner...</option>
                <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
              </select>
              <textarea *ngSwitchCase="'TEXTAREA'"
                        [(ngModel)]="medical.customFields[field.name]"
                        rows="3"
                        class="fw-input h-auto py-3"></textarea>
              <input *ngSwitchCase="'DATE'" type="date"
                     [(ngModel)]="medical.customFields[field.name]"
                     class="fw-input">
              <input *ngSwitchDefault type="text"
                     [(ngModel)]="medical.customFields[field.name]"
                     class="fw-input">
            </ng-container>
          </div>
        </ng-container>
      </div>

      <ng-template #noFields>
        <div class="flex flex-col items-center justify-center p-12 bg-surface-sunken rounded-3xl border-2 border-dashed border-border text-center">
          <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <lucide-icon [name]="HeartPulse" [size]="24" class="text-text-tertiary"></lucide-icon>
          </div>
          <h3 class="text-sm font-bold text-midnight">Aucune donnée spécifique</h3>
          <p class="text-xs text-text-secondary mt-1 max-w-xs">
            L'établissement ne demande pas d'informations médicales particulières pour ce niveau.
          </p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .animate-fade { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StepMedicalComponent {
  @Input() medical: any;
  @Input() customFields: FieldConfig[] = [];
  @Input() instruction?: string;

  readonly HeartPulse = HeartPulse;
}
