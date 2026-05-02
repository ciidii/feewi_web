import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

// Champs optionnels "preset" qui correspondent à des propriétés top-level du Guardian
const GUARDIAN_TOP_LEVEL: ReadonlySet<string> = new Set(['email', 'phone']);

@Component({
  selector: 'app-step-family',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade">
      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-alpha text-primary rounded-xl mb-4">
          <lucide-icon [name]="Users" [size]="24"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight">Responsable légal</h1>
        <p class="text-sm text-text-secondary font-medium mt-2 max-w-lg">
          Veuillez identifier le tuteur principal qui sera le point de contact privilégié pour cet établissement.
        </p>
        <div *ngIf="instruction" class="mt-4 px-4 py-3 bg-primary-alpha/10 rounded-xl border border-primary-alpha text-sm text-text-secondary">
          {{ instruction }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-x-8 gap-y-2">

        <!-- Lien de parenté -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('relation') }}</label>
          <select [(ngModel)]="data.primaryGuardian.relation" class="fw-input">
            <option value="FATHER">Père</option>
            <option value="MOTHER">Mère</option>
            <option value="UNCLE">Oncle</option>
            <option value="AUNT">Tante</option>
            <option value="GRANDPARENT">Grand-parent</option>
            <option value="GUARDIAN">Tuteur légal</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <div class="hidden md:block"></div>

        <!-- Nom -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('lastName') }}</label>
          <input type="text" [(ngModel)]="data.primaryGuardian.lastName" class="fw-input" placeholder="Ex: NDIAYE">
        </div>

        <!-- Prénom -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('firstName') }}</label>
          <input type="text" [(ngModel)]="data.primaryGuardian.firstName" class="fw-input" placeholder="Ex: Moussa">
        </div>

        <!-- Téléphone -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('phone') }}</label>
          <input type="tel" [(ngModel)]="data.primaryGuardian.phone" class="fw-input" placeholder="+221 .. ... .. ..">
        </div>

        <!-- Champs dynamiques (preset + custom) -->
        <ng-container *ngFor="let field of customFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>

            <!-- Champ top-level (ex: email) -->
            <ng-container *ngIf="isTopLevel(field.name); else customField">
              <input [type]="field.name === 'email' ? 'email' : 'text'"
                     [(ngModel)]="data.primaryGuardian[field.name]"
                     class="fw-input"
                     [placeholder]="field.name === 'email' ? 'parent@exemple.com' : ''">
            </ng-container>

            <!-- Champ customFields -->
            <ng-template #customField>
              <ng-container [ngSwitch]="field.type">
                <select *ngSwitchCase="'SELECT'"
                        [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                        class="fw-input">
                  <option value="">Sélectionner...</option>
                  <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                </select>
                <textarea *ngSwitchCase="'TEXTAREA'"
                          [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                          rows="3"
                          class="fw-input h-auto py-3"></textarea>
                <input *ngSwitchCase="'DATE'" type="date"
                       [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                       class="fw-input">
                <input *ngSwitchDefault type="text"
                       [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                       class="fw-input">
              </ng-container>
            </ng-template>
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
export class StepFamilyComponent {
  @Input() data: any;
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Input() customFields: FieldConfig[] = [];
  @Input() instruction?: string;

  readonly Users = Users;

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }

  isTopLevel(name: string): boolean {
    return GUARDIAN_TOP_LEVEL.has(name);
  }
}
