import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { LucideAngularModule, MoreHorizontal } from 'lucide-angular';
import { RowAction, TableRow } from '../../../../models/data-list.models';

@Component({
  selector: 'app-row-actions',
  standalone: true,
  imports: [CommonModule, MatMenuModule, LucideAngularModule],
  template: `
    <button
      [matMenuTriggerFor]="menu"
      class="row-actions-trigger"
      (click)="$event.stopPropagation()"
      aria-label="Actions"
    >
      <lucide-icon [name]="MoreHorizontal" [size]="18"></lucide-icon>
    </button>

    <mat-menu #menu="matMenu" class="fw-row-menu" xPosition="before">
      <ng-container *ngFor="let action of actions()">
        <button
          *ngIf="!action.hideIf || !action.hideIf(row())"
          mat-menu-item
          (click)="onAction.emit({ actionId: action.id, row: row() })"
          [disabled]="action.disableIf && action.disableIf(row())"
          [class.danger]="action.type === 'danger'"
        >
          <div class="menu-item-content">
            <lucide-icon [name]="action.icon" [size]="16" class="action-icon"></lucide-icon>
            <span class="action-label">{{ action.label }}</span>
          </div>
        </button>
      </ng-container>
    </mat-menu>
  `,
  styles: [`
    .row-actions-trigger {
      width: 32px;
      height: 32px;
      border-radius: var(--fw-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--fw-text-tertiary);
      cursor: pointer;
      transition: var(--fw-transition-fast);

      &:hover {
        background: var(--fw-surface-sunken);
        color: var(--fw-text-primary);
      }
    }

    .menu-item-content {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .action-icon {
        color: var(--fw-text-tertiary);
      }
    }

    button[mat-menu-item].danger {
      color: var(--fw-error);
      .action-icon { color: var(--fw-error); }
    }
  `]
})
export class RowActions {
  row = input.required<TableRow>();
  actions = input.required<RowAction[]>();

  onAction = output<{ actionId: string, row: TableRow }>();

  readonly MoreHorizontal = MoreHorizontal;
}
