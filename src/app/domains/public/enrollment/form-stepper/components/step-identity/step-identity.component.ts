import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-identity',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>L'Élève</h1>
        <p>Informations d'état civil et vœu de scolarité.</p>
      </div>

      <div class="premium-form-grid">
        <!-- Niveau scolaire -->
        <div class="form-group full">
          <label>{{ coreLabels('levelId') }}</label>
          <select [(ngModel)]="schooling.levelId" (change)="onLevelChange.emit(schooling.levelId)"
                  class="premium-select highlight">
            <option value="">Sélectionnez un niveau...</option>
            <option *ngFor="let level of availableLevels" [value]="level.id">{{ level.name }}</option>
          </select>
        </div>

        <!-- Champs core identité -->
        <div class="form-group">
          <label>{{ coreLabels('firstName') }}</label>
          <input type="text" [(ngModel)]="identity.firstName" class="premium-input">
        </div>
        <div class="form-group">
          <label>{{ coreLabels('lastName') }}</label>
          <input type="text" [(ngModel)]="identity.lastName" class="premium-input">
        </div>
        <div class="form-group">
          <label>{{ coreLabels('gender') }}</label>
          <select [(ngModel)]="identity.gender" class="premium-select">
            <option value="MALE">Masculin</option>
            <option value="FEMALE">Féminin</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ coreLabels('birthDate') }}</label>
          <input type="date" [(ngModel)]="identity.birthDate" class="premium-input">
        </div>
        <div class="form-group">
          <label>{{ coreLabels('birthPlace') }}</label>
          <input type="text" [(ngModel)]="identity.birthPlace" class="premium-input" placeholder="Ville de naissance">
        </div>

        <!-- Champs custom dynamiques -->
        <ng-container *ngFor="let field of customFields">
          <div class="form-group" [class.full]="field.type === 'TEXTAREA'">
            <label>{{ field.label }} <span *ngIf="field.mandatory" class="text-red-500">*</span></label>
            <ng-container [ngSwitch]="field.type">
              <select *ngSwitchCase="'SELECT'" [(ngModel)]="identity.customFields[field.name]" class="premium-select">
                <option value="">Sélectionner...</option>
                <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
              </select>
              <textarea *ngSwitchCase="'TEXTAREA'" [(ngModel)]="identity.customFields[field.name]" class="premium-textarea" rows="3"></textarea>
              <input *ngSwitchCase="'DATE'" type="date" [(ngModel)]="identity.customFields[field.name]" class="premium-input">
              <input *ngSwitchDefault type="text" [(ngModel)]="identity.customFields[field.name]" class="premium-input">
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
  @Input() customFields: FieldConfig[] = [];
  @Input() availableLevels: any[] = [];
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Output() onLevelChange = new EventEmitter<string>();

  coreLabels(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }
}
