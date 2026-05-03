import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeartPulse, LucideAngularModule, Info, ShieldCheck } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-medical',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade">
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="HeartPulse" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">{{ title || 'Santé & Bien-être' }}</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          {{ subtitle || 'Ces informations sont strictement confidentielles et ne seront accessibles qu au personnel habilité.' }}
        </p>

        <!-- 💡 Dynamic Instruction Banner -->
        <div *ngIf="instruction" class="mt-6 p-4 bg-primary-alpha/5 border-l-4 border-primary rounded-r-xl flex gap-3 items-start">
          <lucide-icon [name]="Info" [size]="18" class="text-primary shrink-0 mt-0.5"></lucide-icon>
          <p class="text-sm font-semibold text-primary leading-snug">{{ instruction }}</p>
        </div>
      </div>

      <div *ngIf="customFields.length > 0; else noFields" class="grid grid-cols-2 gap-x-8 gap-y-1">
        <ng-container *ngFor="let field of customFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>
            <div class="fw-input-wrapper" [class.h-auto]="field.type === 'TEXTAREA'">
              <ng-container [ngSwitch]="field.type">
                <ng-container *ngSwitchCase="'SELECT'">
                  <select [(ngModel)]="medical.customFields[field.name]"
                          [name]="'med_' + field.name" [required]="field.mandatory" #mfld1="ngModel"
                          class="fw-input">
                    <option value="">Sélectionner...</option>
                    <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                  </select>
                  <span *ngIf="mfld1.invalid && mfld1.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>

                <ng-container *ngSwitchCase="'TEXTAREA'">
                  <textarea [(ngModel)]="medical.customFields[field.name]"
                            [name]="'med_' + field.name" [required]="field.mandatory" #mfld2="ngModel"
                            rows="3"
                            class="fw-input py-4"></textarea>
                  <span *ngIf="mfld2.invalid && mfld2.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>

                <ng-container *ngSwitchCase="'DATE'">
                  <input type="date" [(ngModel)]="medical.customFields[field.name]"
                         [name]="'med_' + field.name" [required]="field.mandatory" #mfld3="ngModel"
                         class="fw-input">
                  <span *ngIf="mfld3.invalid && mfld3.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>

                <ng-container *ngSwitchDefault>
                  <input type="text" [(ngModel)]="medical.customFields[field.name]"
                         [name]="'med_' + field.name" [required]="field.mandatory" #mfld4="ngModel"
                         class="fw-input">
                  <span *ngIf="mfld4.invalid && mfld4.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Confidentiality Seal -->
      <div *ngIf="customFields.length > 0" class="mt-12 p-6 bg-white border border-border rounded-3xl flex items-center gap-4">
        <div class="w-12 h-12 bg-success-bg text-success rounded-full flex items-center justify-center shrink-0">
          <lucide-icon [name]="ShieldCheck" [size]="24"></lucide-icon>
        </div>
        <p class="text-xs text-text-secondary leading-relaxed font-medium">
          <strong class="text-midnight block mb-0.5">Protection des données de santé</strong>
          Vos réponses sont protégées par le secret médical scolaire et utilisées uniquement pour la sécurité de l'élève.
        </p>
      </div>

      <ng-template #noFields>
        <div class="flex flex-col items-center justify-center p-16 bg-surface-sunken rounded-[32px] border-2 border-dashed border-border text-center">
          <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <lucide-icon [name]="HeartPulse" [size]="32" class="text-text-tertiary opacity-40"></lucide-icon>
          </div>
          <h3 class="text-lg font-bold text-midnight">Aucune donnée spécifique</h3>
          <p class="text-sm text-text-secondary mt-2 max-w-xs leading-relaxed font-medium">
            L'établissement ne demande pas d'informations médicales particulières pour ce niveau scolaire.
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
  @Input() title?: string;
  @Input() subtitle?: string;

  readonly HeartPulse = HeartPulse;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly Info = Info;
}
