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
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">{{ title || 'Identité de l élève' }}</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          {{ subtitle || 'Saisissez les informations d état civil de l enfant et sélectionnez son futur niveau scolaire.' }}
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
          <label class="fw-label text-primary font-bold">
            {{ coreLabel('levelId') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper mt-2 border-primary-alpha bg-white focus-within:border-primary">
            <select [(ngModel)]="schooling.levelId"
                    name="levelId" required #lvl="ngModel"
                    (change)="onLevelChange.emit(schooling.levelId)"
                    class="fw-input">
              <option value="">Sélectionnez le niveau souhaité...</option>
              <optgroup *ngFor="let group of groupedLevels" [label]="group.cycle.name || group.cycle.systemName">
                <option *ngFor="let level of group.levels" [value]="level.id">{{ level.name }}</option>
              </optgroup>
            </select>
          </div>
          <span *ngIf="lvl.invalid && lvl.touched" class="fw-error-text">Le choix du niveau est obligatoire pour continuer.</span>
          <span class="fw-hint text-primary/70 mt-3 font-medium" *ngIf="!(lvl.invalid && lvl.touched)">Le choix du niveau détermine les documents requis pour le dossier.</span>
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
                <ng-container *ngSwitchCase="'SELECT'">
                  <select [(ngModel)]="schooling.customFields[field.name]"
                          [name]="'sch_' + field.name" [required]="field.mandatory" #fld1="ngModel" class="fw-input">
                    <option value="">Sélectionner...</option>
                    <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                  </select>
                  <span *ngIf="fld1.invalid && fld1.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchCase="'TEXTAREA'">
                  <textarea [(ngModel)]="schooling.customFields[field.name]"
                            [name]="'sch_' + field.name" [required]="field.mandatory" #fld2="ngModel"
                            rows="3" class="fw-input py-4"></textarea>
                  <span *ngIf="fld2.invalid && fld2.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchCase="'DATE'">
                  <input type="date" [(ngModel)]="schooling.customFields[field.name]"
                         [name]="'sch_' + field.name" [required]="field.mandatory" #fld3="ngModel" class="fw-input">
                  <span *ngIf="fld3.invalid && fld3.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchDefault>
                  <input type="text" [(ngModel)]="schooling.customFields[field.name]"
                         [name]="'sch_' + field.name" [required]="field.mandatory" #fld4="ngModel" class="fw-input">
                  <span *ngIf="fld4.invalid && fld4.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
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
          <label class="fw-label">
            {{ coreLabel('firstName') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="identity.firstName" name="firstName" required #fname="ngModel"
                   class="fw-input" placeholder="Prénom de l'enfant">
          </div>
          <span *ngIf="fname.invalid && fname.touched" class="fw-error-text">Le prénom est requis.</span>
        </div>

        <!-- Nom -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('lastName') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="identity.lastName" name="lastName" required #lname="ngModel"
                   class="fw-input" placeholder="Nom de famille">
          </div>
          <span *ngIf="lname.invalid && lname.touched" class="fw-error-text">Le nom est requis.</span>
        </div>

        <!-- Genre -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('gender') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <select [(ngModel)]="identity.gender" name="gender" required #gndr="ngModel" class="fw-input">
              <option value="MALE">Garçon</option>
              <option value="FEMALE">Fille</option>
            </select>
          </div>
          <span *ngIf="gndr.invalid && gndr.touched" class="fw-error-text">Veuillez préciser le genre.</span>
        </div>

        <!-- Date de naissance -->
        <div class="fw-field">
          <label class="fw-label">
            {{ coreLabel('birthDate') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="date" [(ngModel)]="identity.birthDate" name="birthDate" required #bdate="ngModel" class="fw-input">
          </div>
          <span *ngIf="bdate.invalid && bdate.touched" class="fw-error-text">La date de naissance est requise.</span>
        </div>

        <!-- Lieu de naissance -->
        <div class="col-span-2 fw-field">
          <label class="fw-label">
            {{ coreLabel('birthPlace') }}
            <span class="required">*</span>
          </label>
          <div class="fw-input-wrapper">
            <input type="text" [(ngModel)]="identity.birthPlace" name="birthPlace" required #bplace="ngModel"
                   class="fw-input" placeholder="Ville ou lieu de naissance">
          </div>
          <span *ngIf="bplace.invalid && bplace.touched" class="fw-error-text">Veuillez indiquer le lieu de naissance.</span>
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
                <ng-container *ngSwitchCase="'SELECT'">
                  <select [(ngModel)]="identity.customFields[field.name]"
                          [name]="'id_' + field.name" [required]="field.mandatory" #idf1="ngModel" class="fw-input">
                    <option value="">Sélectionner...</option>
                    <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
                  </select>
                  <span *ngIf="idf1.invalid && idf1.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchCase="'TEXTAREA'">
                  <textarea [(ngModel)]="identity.customFields[field.name]"
                            [name]="'id_' + field.name" [required]="field.mandatory" #idf2="ngModel"
                            rows="3" class="fw-input py-4"></textarea>
                  <span *ngIf="idf2.invalid && idf2.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchCase="'DATE'">
                  <input type="date" [(ngModel)]="identity.customFields[field.name]"
                         [name]="'id_' + field.name" [required]="field.mandatory" #idf3="ngModel" class="fw-input">
                  <span *ngIf="idf3.invalid && idf3.touched" class="fw-error-text">Ce champ est obligatoire.</span>
                </ng-container>
                <ng-container *ngSwitchDefault>
                  <input type="text" [(ngModel)]="identity.customFields[field.name]"
                         [name]="'id_' + field.name" [required]="field.mandatory" #idf4="ngModel" class="fw-input">
                  <span *ngIf="idf4.invalid && idf4.touched" class="fw-error-text">Ce champ est obligatoire.</span>
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
export class StepIdentityComponent {
  @Input() identity: any;
  @Input() schooling: any;
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Input() customFields: FieldConfig[] = [];
  @Input() schoolingCustomFields: FieldConfig[] = [];
  @Input() availableLevels: any[] = [];
  @Input() groupedLevels: CycleGroup[] = [];
  @Input() instruction?: string;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Output() onLevelChange = new EventEmitter<string>();

  readonly User = User;

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }

  protected readonly Info = Info;
}
