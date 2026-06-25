import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Calendar, Filter, LucideAngularModule, School, X} from 'lucide-angular';
import {FwButtonComponent} from '../button/button.component';
import {FwModalShellComponent} from '../modal-shell/modal-shell.component';

export interface FilterOption {
  label: string;
  value: any;
}

export interface FilterGroup {
  label: string;
  options: FilterOption[];
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'date' | 'checkbox';
  placeholder?: string;
  options?: FilterOption[];
  groups?: FilterGroup[];
  defaultValue?: any;
}

export interface SharedFilterData {
  title?: string;
  fields: FilterField[];
  initialValues: Record<string, any>;
}

@Component({
  selector: 'app-shared-filter-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    LucideAngularModule,
    FwModalShellComponent,
    FwButtonComponent
  ],
  template: `
    <app-fw-modal-shell
      [title]="data.title || 'Filtres Avancés'"
      [icon]="FilterIcon"
      (close)="onCancel()"
    >
      <div class="p-6 space-y-8">
        <div class="grid grid-cols-1 gap-6">
          
          <ng-container *ngFor="let field of data.fields">
            <div class="fw-field">
              <label class="fw-label">{{ field.label }}</label>
              
              <div class="fw-input-wrapper">
                <!-- SELECT SIMPLE -->
                <select *ngIf="field.type === 'select' && !field.groups" 
                        [(ngModel)]="form[field.key]" 
                        class="fw-input">
                  <option value="">{{ field.placeholder || 'Tous' }}</option>
                  <option *ngFor="let opt of field.options" [value]="opt.value">{{ opt.label }}</option>
                </select>

                <!-- SELECT GROUPÉ -->
                <select *ngIf="field.type === 'select' && field.groups" 
                        [(ngModel)]="form[field.key]" 
                        class="fw-input">
                  <option value="">{{ field.placeholder || 'Tous' }}</option>
                  <optgroup *ngFor="let group of field.groups" [label]="group.label">
                    <option *ngFor="let opt of group.options" [value]="opt.value">{{ opt.label }}</option>
                  </optgroup>
                </select>

                <!-- DATE -->
                <input *ngIf="field.type === 'date'" 
                       type="date" 
                       [(ngModel)]="form[field.key]" 
                       class="fw-input">

                <!-- CHECKBOX -->
                <label *ngIf="field.type === 'checkbox'" class="flex items-center gap-3 cursor-pointer py-2">
                  <input type="checkbox" [(ngModel)]="form[field.key]" class="w-4 h-4 rounded border-slate-300">
                  <span class="text-sm font-medium text-slate-600">{{ field.placeholder || field.label }}</span>
                </label>
              </div>
            </div>
          </ng-container>

        </div>
      </div>

      <div footer class="flex items-center justify-between w-full p-6 border-t border-border bg-surface-sunken">
        <app-fw-button variant="tertiary" size="md" (click)="onReset()">
          Réinitialiser
        </app-fw-button>
        <div class="flex gap-3">
          <app-fw-button variant="ghost" size="md" (click)="onCancel()">Annuler</app-fw-button>
          <app-fw-button variant="primary" size="md" (click)="onApply()">Appliquer les filtres</app-fw-button>
        </div>
      </div>
    </app-fw-modal-shell>
  `,
  styles: [`
    .fw-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .fw-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--fw-text-tertiary); margin-left: 4px; }
    .fw-input-wrapper { position: relative; }
    .fw-input {
      width: 100%; height: 3rem; background: var(--fw-surface-sunken); border: 1.5px solid var(--fw-border-subtle);
      border-radius: 12px; padding: 0 1rem; font-size: 0.875rem; font-weight: 600;
      color: var(--fw-midnight); outline: none; transition: all 0.2s;
      &:focus { background: white; border-color: var(--fw-primary); box-shadow: 0 0 0 4px var(--fw-primary-alpha); }
    }
  `]
})
export class SharedFilterModalComponent {
  private dialogRef = inject(MatDialogRef<SharedFilterModalComponent>);
  data: SharedFilterData = inject(MAT_DIALOG_DATA);

  form: Record<string, any> = { ...this.data.initialValues };

  readonly FilterIcon = Filter;

  onReset() {
    this.data.fields.forEach(f => {
      this.form[f.key] = f.defaultValue !== undefined ? f.defaultValue : '';
    });
  }

  onApply() {
    this.dialogRef.close(this.form);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
