import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Info, LucideAngularModule, UserCog, Users} from 'lucide-angular';
import {FieldConfig} from '../../../../../../core/models/enrollment';

// Champs optionnels "preset" qui correspondent à des propriétés top-level du Guardian
const GUARDIAN_TOP_LEVEL: ReadonlySet<string> = new Set(['email', 'phone']);

@Component({
  selector: 'app-step-family',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade">
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="Users" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">{{ title || 'Responsable légal' }}</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          {{ subtitle || 'Identifiez le tuteur principal qui sera le point de contact privilégié pour l\\'établissement.' }}
        </p>

        <!-- 💡 Dynamic Instruction Banner -->
        <div *ngIf="instruction" class="mt-6 p-4 bg-primary-alpha/5 border-l-4 border-primary rounded-r-xl flex gap-3 items-start">
          <lucide-icon [name]="Info" [size]="18" class="text-primary shrink-0 mt-0.5"></lucide-icon>
          <p class="text-sm font-semibold text-primary leading-snug">{{ instruction }}</p>
        </div>
      </div>

      <!-- 👤 Option Élève Autonome (Si autorisé) -->
      <div *ngIf="allowedWithoutGuardian" class="mb-10 p-6 bg-surface-sunken border border-border rounded-3xl flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-midnight shadow-sm">
            <lucide-icon [name]="UserCog" [size]="24"></lucide-icon>
          </div>
          <div>
            <h4 class="font-black text-midnight text-sm uppercase tracking-tight">Inscription en autonomie</h4>
            <p class="text-xs text-text-secondary font-medium">Cochez cette case si l'élève est son propre responsable légal.</p>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" [(ngModel)]="data.isIndependent" class="sr-only peer">
          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-midnight"></div>
        </label>
      </div>

      <!-- 📝 Form Grid -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-1" [class.opacity-40]="data.isIndependent" [class.pointer-events-none]="data.isIndependent">

        <!-- Lien de parenté -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('relation') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <select [(ngModel)]="data.primaryGuardian.relation" name="relation" required #rel="ngModel" class="fw-input">
              <option value="FATHER">Père</option>
              <option value="MOTHER">Mère</option>
              <option value="UNCLE">Oncle</option>
              <option value="AUNT">Tante</option>
              <option value="GRANDPARENT">Grand-parent</option>
              <option value="GUARDIAN">Tuteur légal</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <span *ngIf="rel.invalid && rel.touched" class="fw-error-text">Le lien de parenté est requis.</span>
        </div>

        <div class="hidden md:block"></div>

        <!-- Nom -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('lastName') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="data.primaryGuardian.lastName" name="lastName" required #glname="ngModel"
                   class="fw-input" placeholder="Ex: NDIAYE">
          </div>
          <span *ngIf="glname.invalid && glname.touched" class="fw-error-text">Le nom est requis.</span>
        </div>

        <!-- Prénom -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('firstName') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="data.primaryGuardian.firstName" name="firstName" required #gfname="ngModel"
                   class="fw-input" placeholder="Ex: Moussa">
          </div>
          <span *ngIf="gfname.invalid && gfname.touched" class="fw-error-text">Le prénom est requis.</span>
        </div>

        <!-- Téléphone -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('phone') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="tel" [(ngModel)]="data.primaryGuardian.phone" name="phone" required #gphone="ngModel"
                   class="fw-input" placeholder="+221 .. ... .. ..">
          </div>
          <span *ngIf="gphone.invalid && gphone.touched" class="fw-error-text">Le téléphone est requis.</span>
        </div>

        <!-- Email -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('email') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="email" [(ngModel)]="data.primaryGuardian.email" name="email" required #gemail="ngModel"
                   class="fw-input" placeholder="parent@exemple.com">
          </div>
          <span *ngIf="gemail.invalid && gemail.touched" class="fw-error-text">L'email est requis.</span>
        </div>

        <!-- Champs dynamiques (preset + custom) -->
        <ng-container *ngFor="let field of customFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>

            <div class="fw-input-wrapper" [class.h-auto]="field.type === 'TEXTAREA'">
              <!-- Champ top-level (ex: adresse) -->
              <ng-container *ngIf="isTopLevel(field.name); else customField">
                <input [type]="'text'"
                       [(ngModel)]="data.primaryGuardian[field.name]"
                       [name]="'g_' + field.name" [required]="field.mandatory" #gfld="ngModel"
                       class="fw-input">
                <span *ngIf="gfld.invalid && gfld.touched" class="fw-error-text">Ce champ est obligatoire.</span>
              </ng-container>

              <!-- Champ customFields -->
              <ng-template #customField>
                <ng-container [ngSwitch]="field.type">
                  <ng-container *ngSwitchCase="'SELECT'">
                    <select [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                            [name]="'gc_' + field.name" [required]="field.mandatory" #gfld1="ngModel"
                            class="fw-input">
                      <option value="">Sélectionner...</option>
                      <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                    </select>
                    <span *ngIf="gfld1.invalid && gfld1.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'TEXTAREA'">
                    <textarea [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                              [name]="'gc_' + field.name" [required]="field.mandatory" #gfld2="ngModel"
                              rows="3"
                              class="fw-input py-4"></textarea>
                    <span *ngIf="gfld2.invalid && gfld2.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'DATE'">
                    <input type="date" [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                           [name]="'gc_' + field.name" [required]="field.mandatory" #gfld3="ngModel"
                           class="fw-input">
                    <span *ngIf="gfld3.invalid && gfld3.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                  </ng-container>
                  <ng-container *ngSwitchDefault>
                    <input type="text" [(ngModel)]="data.primaryGuardian.customFields[field.name]"
                           [name]="'gc_' + field.name" [required]="field.mandatory" #gfld4="ngModel"
                           class="fw-input">
                    <span *ngIf="gfld4.invalid && gfld4.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                  </ng-container>
                </ng-container>
              </ng-template>
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
export class StepFamilyComponent {
  @Input() data: any;
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Input() customFields: FieldConfig[] = [];
  @Input() instruction?: string;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() allowedWithoutGuardian = false;

  readonly Users = Users;
  readonly UserCog = UserCog;

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }

  isPillarFieldEnabled(field: string): boolean {
    return !!this.coreFieldControls?.[field];
  }

  isTopLevel(name: string): boolean {
    return GUARDIAN_TOP_LEVEL.has(name);
  }

  protected readonly Info = Info;
}
