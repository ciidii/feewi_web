import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {LucideAngularModule} from 'lucide-angular';
import {FieldConfig} from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-family',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Identité du Responsable</h1>
        <p>Commençons par identifier le tuteur légal de l'enfant.</p>
      </div>

      <div class="premium-form-grid">
        <div class="form-group">
          <label>{{ coreLabel('relation') }}</label>
          <select [(ngModel)]="data.primaryGuardian.relation" class="premium-select">
            <option value="FATHER">Père</option>
            <option value="MOTHER">Mère</option>
            <option value="UNCLE">Oncle</option>
            <option value="AUNT">Tante</option>
            <option value="GRANDPARENT">Grand-parent</option>
            <option value="GUARDIAN">Tuteur Légal</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
        <div class="form-group">
          <label>Email de contact</label>
          <input type="email" [(ngModel)]="data.primaryGuardian.email" class="premium-input" placeholder="nom@exemple.com">
        </div>
        <div class="form-group">
          <label>{{ coreLabel('lastName') }}</label>
          <input type="text" [(ngModel)]="data.primaryGuardian.lastName" class="premium-input">
        </div>
        <div class="form-group">
          <label>{{ coreLabel('firstName') }}</label>
          <input type="text" [(ngModel)]="data.primaryGuardian.firstName" class="premium-input">
        </div>
        <div class="form-group">
          <label>{{ coreLabel('phone') }}</label>
          <input type="tel" [(ngModel)]="data.primaryGuardian.phone" class="premium-input">
        </div>

        <!-- CHAMPS DYNAMIQUES CMS FAMILLE (dont adresse si configurée) -->
        <ng-container *ngFor="let field of customFields">
          <div class="form-group" [class.full]="field.type === 'TEXTAREA' || field.type === 'TEXT'">
            <label>{{ field.label }} <span *ngIf="field.mandatory" class="text-red-500">*</span></label>
            <ng-container [ngSwitch]="field.type">
              <select *ngSwitchCase="'SELECT'" [(ngModel)]="data.primaryGuardian.customFields[field.name]" class="premium-select">
                <option value="">Sélectionner...</option>
                <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
              </select>
              <textarea *ngSwitchCase="'TEXTAREA'" [(ngModel)]="data.primaryGuardian.customFields[field.name]" class="premium-textarea" rows="3"></textarea>
              <input *ngSwitchCase="'DATE'" type="date" [(ngModel)]="data.primaryGuardian.customFields[field.name]" class="premium-input">
              <input *ngSwitchDefault type="text" [(ngModel)]="data.primaryGuardian.customFields[field.name]" class="premium-input">
            </ng-container>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class StepFamilyComponent {
  @Input() data: any;
  @Input() coreFieldControls: Record<string, { label: string }> = {};
  @Input() customFields: FieldConfig[] = [];

  coreLabel(field: string): string {
    return this.coreFieldControls?.[field]?.label ?? field;
  }
}
