import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Info } from 'lucide-angular';
import { FieldConfig } from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-medical',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Santé</h1>
        <p>Données médicales confidentielles.</p>
      </div>

      <div class="premium-form-grid" *ngIf="customFields.length > 0; else noMedical">
        <ng-container *ngFor="let field of customFields">
          <div class="form-group" [class.full]="field.type === 'TEXTAREA'">
            <label>{{ field.label }} <span *ngIf="field.mandatory" class="text-red-500">*</span></label>
            <ng-container [ngSwitch]="field.type">
              <select *ngSwitchCase="'SELECT'" [(ngModel)]="medical.customFields[field.name]" class="premium-select">
                <option value="">—</option>
                <option *ngFor="let opt of field.options ?? []" [value]="opt">{{ opt }}</option>
              </select>
              <textarea *ngSwitchCase="'TEXTAREA'" [(ngModel)]="medical.customFields[field.name]" class="premium-textarea" rows="3"></textarea>
              <input *ngSwitchCase="'DATE'" type="date" [(ngModel)]="medical.customFields[field.name]" class="premium-input">
              <input *ngSwitchDefault type="text" [(ngModel)]="medical.customFields[field.name]" class="premium-input">
            </ng-container>
          </div>
        </ng-container>
      </div>

      <ng-template #noMedical>
        <div class="empty-step-hint flex items-center gap-3 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <lucide-icon [name]="Info" [size]="20" class="text-slate-400"></lucide-icon>
          <p class="text-slate-500 font-medium">Aucune information médicale requise par l'établissement.</p>
        </div>
      </ng-template>
    </div>
  `
})
export class StepMedicalComponent {
  @Input() medical: any;
  @Input() customFields: FieldConfig[] = [];

  readonly Info = Info;
}
