import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Info, LucideAngularModule, User} from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';
import { CycleGroup } from '../../../../../../core/models/academic.model';

@Component({
  selector: 'app-step-identity',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade">
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="User" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">Identité de l'élève</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          Saisissez les informations d'état civil de l'enfant et sélectionnez son futur niveau scolaire.
        </p>

        <!-- 💡 Dynamic Instruction Banner -->
        <div *ngIf="instruction" class="mt-6 p-4 bg-primary-alpha/5 border-l-4 border-primary rounded-r-xl flex gap-3 items-start">
          <lucide-icon [name]="Info" [size]="18" class="text-primary shrink-0 mt-0.5"></lucide-icon>
          <p class="text-sm font-semibold text-primary leading-snug">{{ instruction }}</p>
        </div>
      </div>

      <!-- ── Section Vœu scolaire ──────────────────────────────── -->
      <div class="flex items-center gap-3 mb-8">
        <div class="w-1.5 h-6 bg-primary rounded-full"></div>
        <span class="text-[11px] font-black uppercase tracking-[0.2em] text-text-tertiary">Vœu scolaire</span>
      </div>

      <div class="grid grid-cols-2 gap-x-8 gap-y-1 mb-12">

        <!-- Niveau scolaire (Highlight) -->
        <div class="col-span-2 fw-field p-8 bg-primary-alpha/5 rounded-3xl border-2 border-primary-alpha mb-4">
          <label class="fw-label text-primary font-bold">{{ coreLabel('levelId') }}</label>
          <div class="fw-input-wrapper mt-2 border-primary-alpha bg-white focus-within:border-primary">
            <select [(ngModel)]="schooling.levelId"
                    (change)="onLevelChange.emit(schooling.levelId)"
                    class="fw-input">
              <option value="">Sélectionnez le niveau souhaité...</option>
              <optgroup *ngFor="let group of groupedLevels" [label]="group.cycle.name || group.cycle.systemName">
                <option *ngFor="let level of group.levels" [value]="level.id">{{ level.name }}</option>
              </optgroup>
            </select>
          </div>
          <span class="fw-hint text-primary/70 mt-3 font-medium">Le choix du niveau détermine les documents requis pour le dossier.</span>
        </div>

        <!-- Champs dynamiques Scolarité -->
        <ng-container *ngFor="let field of schoolingCustomFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>
            <div class="fw-input-wrapper" [class.h-auto]="field.type === 'TEXTAREA'">
              <ng-container [ngSwitch]="field.type">
                <select *ngSwitchCase="'SELECT'" [(ngModel)]="schooling.customFields[field.name]" class="fw-input">
                  <option value="">Sélectionner...</option>
                  <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                </select>
                <textarea *ngSwitchCase="'TEXTAREA'" [(ngModel)]="schooling.customFields[field.name]" rows="3" class="fw-input py-4"></textarea>
                <input *ngSwitchCase="'DATE'" type="date" [(ngModel)]="schooling.customFields[field.name]" class="fw-input">
                <input *ngSwitchDefault type="text" [(ngModel)]="schooling.customFields[field.name]" class="fw-input">
              </ng-container>
            </div>
          </div>
        </ng-container>

      </div>

      <!-- ── Section État civil ─────────────────────────────────── -->
      <div class="flex items-center gap-3 mb-8">
        <div class="w-1.5 h-6 bg-midnight rounded-full"></div>
        <span class="text-[11px] font-black uppercase tracking-[0.2em] text-text-tertiary">État civil</span>
      </div>

      <div class="grid grid-cols-2 gap-x-8 gap-y-1">

        <!-- Prénom -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('firstName') }}</label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="identity.firstName" class="fw-input" placeholder="Prénom de l'enfant">
          </div>
        </div>

        <!-- Nom -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('lastName') }}</label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="identity.lastName" class="fw-input" placeholder="Nom de famille">
          </div>
        </div>

        <!-- Genre -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('gender') }}</label>
          <div class="fw-input-wrapper">
            <select [(ngModel)]="identity.gender" class="fw-input">
              <option value="MALE">Garçon</option>
              <option value="FEMALE">Fille</option>
            </select>
          </div>
        </div>

        <!-- Date de naissance -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('birthDate') }}</label>
          <div class="fw-input-wrapper">
            <input type="date" [(ngModel)]="identity.birthDate" class="fw-input">
          </div>
        </div>

        <!-- Lieu de naissance -->
        <div class="col-span-2 fw-field">
          <label class="fw-label">{{ coreLabel('birthPlace') }}</label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="identity.birthPlace" class="fw-input" placeholder="Ville ou lieu de naissance">
          </div>
        </div>

        <!-- Champs dynamiques identité -->
        <ng-container *ngFor="let field of customFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>
            <div class="fw-input-wrapper" [class.h-auto]="field.type === 'TEXTAREA'">
              <ng-container [ngSwitch]="field.type">
                <select *ngSwitchCase="'SELECT'" [(ngModel)]="identity.customFields[field.name]" class="fw-input">
                  <option value="">Sélectionner...</option>
                  <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                </select>
                <textarea *ngSwitchCase="'TEXTAREA'" [(ngModel)]="identity.customFields[field.name]" rows="3" class="fw-input py-4"></textarea>
                <input *ngSwitchCase="'DATE'" type="date" [(ngModel)]="identity.customFields[field.name]" class="fw-input">
                <input *ngSwitchDefault type="text" [(ngModel)]="identity.customFields[field.name]" class="fw-input">
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
export class StepIdentityComponent {
  @Input() identity: any;
  @Input() schooling: any;
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Input() customFields: FieldConfig[] = [];
  @Input() schoolingCustomFields: FieldConfig[] = [];
  @Input() availableLevels: any[] = [];
  @Input() groupedLevels: CycleGroup[] = [];
  @Input() instruction?: string;
  @Output() onLevelChange = new EventEmitter<string>();

  readonly User = User;

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }

  protected readonly Info = Info;
}
