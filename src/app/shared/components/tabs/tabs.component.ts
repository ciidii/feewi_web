import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface FwTab {
  id: string;
  label: string;
  icon?: any;
  count?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-fw-tabs',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="tabs-wrapper" [class.full-width]="fullWidth" [class.compact]="density === 'compact'">
      <div class="tabs-container">
        <button
          *ngFor="let tab of tabs"
          type="button"
          class="tab-item"
          [class.active]="activeTabId === tab.id"
          [disabled]="tab.disabled"
          (click)="onTabClick(tab.id)"
        >
          <!-- Icône -->
          <lucide-icon
            *ngIf="tab.icon"
            [name]="tab.icon"
            [size]="density === 'compact' ? 14 : 16"
            class="tab-icon"
          ></lucide-icon>

          <!-- Label -->
          <span class="tab-label">{{ tab.label }}</span>

          <!-- Badge de compteur -->
          <span class="tab-badge" *ngIf="tab.count !== undefined && tab.count !== null">
            {{ tab.count }}
          </span>

          <!-- Indicateur actif -->
          <div class="active-indicator" *ngIf="activeTabId === tab.id"></div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .tabs-wrapper {
      border-bottom: 1px solid var(--fw-border);
      background: var(--fw-surface-card);
      transition: var(--fw-transition-fast);
      &.full-width { .tabs-container { max-width: none; } }
      &.compact {
        .tab-item { height: 40px; padding: 0 12px; font-size: 0.75rem; }
      }
    }

    .tabs-container {
      display: flex;
      align-items: center;
      gap: 4px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--fw-space-md);
    }

    .tab-item {
      height: 52px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 var(--fw-space-md);
      background: transparent;
      border: none;
      color: var(--fw-text-secondary);
      font-family: var(--fw-font-sans);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      position: relative;
      transition: var(--fw-transition-fast);
      white-space: nowrap;

      &:hover:not(:disabled):not(.active) {
        color: var(--fw-text-primary);
        background: var(--fw-surface-sunken);
      }

      &.active {
        color: var(--fw-primary);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .tab-icon {
        opacity: 0.7;
      }

      &.active .tab-icon {
        opacity: 1;
        color: var(--fw-primary);
      }

      .tab-badge {
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: var(--fw-radius-full);
        background: var(--fw-surface-sunken);
        color: var(--fw-text-secondary);
      }

      &.active .tab-badge {
        background: var(--fw-primary-alpha);
        color: var(--fw-primary);
      }

      .active-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: var(--fw-primary);
        border-radius: 3px 3px 0 0;
        animation: slideIn 0.2s ease-out;
      }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: scaleX(0.5); }
      to { opacity: 1; transform: scaleX(1); }
    }
  `]
})
export class FwTabsComponent {
  @Input() tabs: FwTab[] = [];
  @Input() activeTabId!: string;
  @Input() fullWidth = false;
  @Input() density: 'comfortable' | 'compact' = 'comfortable';

  @Output() tabChange = new EventEmitter<string>();

  onTabClick(id: string) {
    if (this.activeTabId !== id) {
      this.tabChange.emit(id);
    }
  }
}
