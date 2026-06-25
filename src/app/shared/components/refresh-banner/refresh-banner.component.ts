import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule, RefreshCw, X} from 'lucide-angular';

@Component({
  selector: 'app-fw-refresh-banner',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="visible" class="refresh-banner-wrapper">
      <div class="refresh-banner animate-in slide-in-from-top-4 duration-300">
        <div class="banner-content">
          <lucide-icon [name]="RefreshIcon" class="icon-spin" [size]="16"></lucide-icon>
          <span class="message">{{ message }}</span>
        </div>

        <div class="banner-actions">
          <button (click)="onRefresh.emit()" class="refresh-btn">
            Actualiser
          </button>
          <button (click)="visible = false" class="close-btn" aria-label="Ignorer">
            <lucide-icon [name]="CloseIcon" [size]="14"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .refresh-banner-wrapper {
      position: absolute;
      top: 1rem;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      z-index: 40;
      pointer-events: none;
    }

    .refresh-banner {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.5rem 0.5rem 0.5rem 1rem;
      background: var(--fw-warning);
      color: white;
      border-radius: var(--fw-radius-full);
      box-shadow: var(--fw-shadow-lg);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .message {
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.01em;
      }
    }

    .banner-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .refresh-btn {
      background: white;
      color: var(--fw-warning);
      border: none;
      padding: 0.35rem 1rem;
      border-radius: var(--fw-radius-full);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      cursor: pointer;
      transition: var(--fw-transition-fast);

      &:hover {
        background: #fffbeb;
        transform: scale(1.02);
      }

      &:active { transform: scale(0.98); }
    }

    .close-btn {
      background: rgba(0, 0, 0, 0.1);
      color: white;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--fw-transition-fast);

      &:hover { background: rgba(0, 0, 0, 0.2); }
    }

    .icon-spin {
      animation: slow-spin 3s infinite linear;
    }

    @keyframes slow-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class FwRefreshBannerComponent {
  @Input() message: string = 'Nouvelles données disponibles';
  @Input() visible: boolean = false;

  @Output() onRefresh = new EventEmitter<void>();

  readonly RefreshIcon = RefreshCw;
  readonly CloseIcon = X;
}
