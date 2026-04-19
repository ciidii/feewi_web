import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-angular';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-fw-alert-banner',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fw-alert-banner animate-in slide-in-from-top-2" [ngClass]="variant" *ngIf="visible">
      <div class="alert-icon">
        <lucide-icon [name]="getIcon()" [size]="20"></lucide-icon>
      </div>
      
      <div class="alert-content">
        <p class="alert-message"><ng-content></ng-content></p>
      </div>

      <button *ngIf="dismissible" (click)="dismiss()" class="dismiss-btn" aria-label="Fermer">
        <lucide-icon [name]="X" [size]="16"></lucide-icon>
      </button>
    </div>
  `,
  styles: [`
    .fw-alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--fw-radius-md);
      border: 1px solid transparent;
      margin-bottom: var(--fw-space-md);
      transition: var(--fw-transition);

      /* VARIANTS */
      &.info {
        background-color: var(--fw-info-bg);
        border-color: var(--fw-info-border);
        color: var(--fw-info);
        .alert-icon { color: var(--fw-info); }
      }

      &.success {
        background-color: var(--fw-success-bg);
        border-color: var(--fw-success-border);
        color: var(--fw-success);
        .alert-icon { color: var(--fw-success); }
      }

      &.warning {
        background-color: var(--fw-warning-bg);
        border-color: var(--fw-warning-border);
        color: var(--fw-warning);
        .alert-icon { color: var(--fw-warning); }
      }

      &.error {
        background-color: var(--fw-error-bg);
        border-color: var(--fw-error-border);
        color: var(--fw-error);
        .alert-icon { color: var(--fw-error); }
      }
    }

    .alert-icon {
      flex-shrink: 0;
      padding-top: 2px;
    }

    .alert-content {
      flex: 1;
      .alert-message {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.5;
        color: var(--fw-text-primary);
      }
    }

    .dismiss-btn {
      flex-shrink: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--fw-text-tertiary);
      padding: 2px;
      border-radius: 4px;
      transition: var(--fw-transition-fast);

      &:hover {
        background-color: rgba(0,0,0,0.05);
        color: var(--fw-text-primary);
      }
    }
  `]
})
export class FwAlertBannerComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() dismissible: boolean = false;
  
  @Output() onClose = new EventEmitter<void>();

  visible = true;
  readonly X = X;

  getIcon() {
    switch (this.variant) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Info;
    }
  }

  dismiss() {
    this.visible = false;
    this.onClose.emit();
  }
}
