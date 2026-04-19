import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, CheckCircle, Archive, Trash2, Download } from 'lucide-angular';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatCheckboxModule],
  template: `
    <div class="bulk-actions-container animate-in slide-in-from-left duration-200">
      <!-- État de la sélection -->
      <div class="selection-status">
        <mat-checkbox 
          color="primary" 
          [checked]="isAllSelected()" 
          [indeterminate]="isPartiallySelected()"
          (change)="onToggleAll.emit()"
          class="scale-90"
        ></mat-checkbox>
        
        <div class="counter-badge">
          <span class="counter-text">{{ selectedCount() }} sélectionné(s)</span>
          <button (click)="onClear.emit()" class="clear-btn" title="Tout désélectionner">
            <lucide-icon [name]="X" [size]="12"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="divider-v"></div>

      <!-- Barre d'actions -->
      <div class="actions-group">
        <button 
          (click)="onBulkValidate.emit([])" 
          class="bulk-btn success" 
          title="Valider la sélection"
        >
          <lucide-icon [name]="CheckCircle" [size]="20"></lucide-icon>
        </button>
        <button class="bulk-btn info" title="Archiver">
          <lucide-icon [name]="Archive" [size]="20"></lucide-icon>
        </button>
        <button class="bulk-btn danger" title="Supprimer">
          <lucide-icon [name]="Trash2" [size]="20"></lucide-icon>
        </button>
        <button class="bulk-btn default" title="Exporter">
          <lucide-icon [name]="Download" [size]="20"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bulk-actions-container {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      height: 100%;
    }

    .selection-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .counter-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--fw-primary-alpha);
      padding: 0.375rem 0.75rem;
      border-radius: var(--fw-radius-lg);
      border: 1px solid var(--fw-primary-alpha);
      
      .counter-text {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--fw-primary);
        letter-spacing: -0.01em;
      }
    }

    .clear-btn {
      display: flex;
      padding: 2px;
      background: transparent;
      border: none;
      color: var(--fw-primary);
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s;

      &:hover { background: var(--fw-primary-alpha); }
    }

    .divider-v {
      height: 1.5rem;
      width: 1.5px;
      background: var(--fw-border);
    }

    .actions-group {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .bulk-btn {
      width: 2.5rem;
      height: 2.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--fw-radius-md);
      background: transparent;
      border: none;
      color: var(--fw-text-secondary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: var(--fw-surface-sunken); color: var(--fw-text-primary); }
      &.success:hover { background: var(--fw-success-bg); color: var(--fw-success); }
      &.info:hover { background: var(--fw-info-bg); color: var(--fw-info); }
      &.danger:hover { background: var(--fw-error-bg); color: var(--fw-error); }
      
      &:active { transform: scale(0.92); }
    }
  `]
})
export class BulkActions {
  selectedCount = input.required<number>();
  isAllSelected = input.required<boolean>();
  isPartiallySelected = input.required<boolean>();

  onClear = output<void>();
  onToggleAll = output<void>();
  onBulkValidate = output<any[]>();

  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly Archive = Archive;
  readonly Trash2 = Trash2;
  readonly Download = Download;
}
