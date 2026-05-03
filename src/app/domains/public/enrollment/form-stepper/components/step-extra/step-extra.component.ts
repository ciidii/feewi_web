import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Info, LucideAngularModule, Sparkles } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-extra',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade">
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="Sparkles" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">{{ title }}</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          {{ subtitle || 'Veuillez renseigner les informations complémentaires demandées par l\\'établissement.' }}
        </p>

        <!-- 💡 Dynamic Instruction Banner -->
        <div *ngIf="instruction" class="mt-6 p-4 bg-primary-alpha/5 border-l-4 border-primary rounded-r-xl flex gap-3 items-start">
          <lucide-icon [name]="Info" [size]="18" class="text-primary shrink-0 mt-0.5"></lucide-icon>
          <p class="text-sm font-semibold text-primary leading-snug">{{ instruction }}</p>
        </div>
      </div>

      <!-- 📝 Form Grid -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-1">
        <ng-container *ngFor="let field of customFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>

            <div class="fw-input-wrapper" [class.h-auto]="field.type === 'TEXTAREA'">
              <ng-container [ngSwitch]="field.type">
                <ng-container *ngSwitchCase="'SELECT'">
                  <select [(ngModel)]="data.customFields[field.name]"
                          [name]="'ex_' + field.name" [required]="field.mandatory" #exfld1="ngModel"
                          class="fw-input">
                    <option value="">Sélectionner...</option>
                    <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                  </select>
                  <span *ngIf="exfld1.invalid && exfld1.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchCase="'TEXTAREA'">
                  <textarea [(ngModel)]="data.customFields[field.name]"
                            [name]="'ex_' + field.name" [required]="field.mandatory" #exfld2="ngModel"
                            rows="3"
                            class="fw-input py-4"></textarea>
                  <span *ngIf="exfld2.invalid && exfld2.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchCase="'DATE'">
                  <input type="date" [(ngModel)]="data.customFields[field.name]"
                         [name]="'ex_' + field.name" [required]="field.mandatory" #exfld3="ngModel"
                         class="fw-input">
                  <span *ngIf="exfld3.invalid && exfld3.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchDefault>
                  <input type="text" [(ngModel)]="data.customFields[field.name]"
                         [name]="'ex_' + field.name" [required]="field.mandatory" #exfld4="ngModel"
                         class="fw-input">
                  <span *ngIf="exfld4.invalid && exfld4.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StepExtraComponent {
  @Input() data: any; // On s'attend à un objet avec { customFields: {} }
  @Input() customFields: FieldConfig[] = [];
  @Input() title = 'Informations complémentaires';
  @Input() subtitle?: string;
  @Input() instruction?: string;

  readonly Sparkles = Sparkles;
  protected readonly Info = Info;
}
