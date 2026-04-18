import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-identity',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade">
      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-alpha text-primary rounded-xl mb-4">
          <lucide-icon [name]="User" [size]="24"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight">Identité de l'élève</h1>
        <p class="text-sm text-text-secondary font-medium mt-2 max-w-lg">
          Saisissez les informations d'état civil de l'enfant et sélectionnez son futur niveau scolaire.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-x-8 gap-y-2">

        <!-- Niveau scolaire (Highlight) -->
        <div class="col-span-2 fw-field mb-10 p-6 bg-primary-alpha/5 rounded-2xl border-2 border-primary-alpha">
          <label class="fw-label text-primary">{{ coreLabel('levelId') }}</label>
          <select [(ngModel)]="schooling.levelId"
                  (change)="onLevelChange.emit(schooling.levelId)"
                  class="fw-input border-primary-alpha bg-white focus:ring-primary/20">
            <option value="">Sélectionnez le niveau souhaité...</option>
            <option *ngFor="let level of availableLevels" [value]="level.id">{{ level.name }}</option>
          </select>
          <span class="fw-hint">Le choix du niveau détermine les documents requis pour le dossier.</span>
        </div>

        <!-- Prénom -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('firstName') }}</label>
          <input type="text" [(ngModel)]="identity.firstName" class="fw-input" placeholder="Prénom de l'enfant">
        </div>

        <!-- Nom -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('lastName') }}</label>
          <input type="text" [(ngModel)]="identity.lastName" class="fw-input" placeholder="Nom de famille">
        </div>

        <!-- Genre -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('gender') }}</label>
          <select [(ngModel)]="identity.gender" class="fw-input">
            <option value="MALE">Garçon</option>
            <option value="FEMALE">Fille</option>
          </select>
        </div>

        <!-- Date de naissance -->
        <div class="fw-field">
          <label class="fw-label">{{ coreLabel('birthDate') }}</label>
          <input type="date" [(ngModel)]="identity.birthDate" class="fw-input">
        </div>

        <!-- Lieu de naissance -->
        <div class="col-span-2 fw-field">
          <label class="fw-label">{{ coreLabel('birthPlace') }}</label>
          <input type="text" [(ngModel)]="identity.birthPlace"
                 class="fw-input" placeholder="Ville ou lieu de naissance">
        </div>

        <!-- Champs dynamiques -->
        <ng-container *ngFor="let field of customFields">
          <div class="fw-field" [class.col-span-2]="field.type === 'TEXTAREA'">
            <label class="fw-label">
              {{ field.label }}
              <span *ngIf="field.mandatory" class="required">*</span>
            </label>
            <ng-container [ngSwitch]="field.type">
              <select *ngSwitchCase="'SELECT'"
                      [(ngModel)]="identity.customFields[field.name]"
                      class="fw-input">
                <option value="">Sélectionner...</option>
                <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
              </select>
              <textarea *ngSwitchCase="'TEXTAREA'"
                        [(ngModel)]="identity.customFields[field.name]"
                        rows="3"
                        class="fw-input h-auto py-3"></textarea>
              <input *ngSwitchCase="'DATE'" type="date"
                     [(ngModel)]="identity.customFields[field.name]"
                     class="fw-input">
              <input *ngSwitchDefault type="text"
                     [(ngModel)]="identity.customFields[field.name]"
                     class="fw-input">
            </ng-container>
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
  @Input() availableLevels: any[] = [];
  @Output() onLevelChange = new EventEmitter<string>();

  readonly User = User;

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }
}
