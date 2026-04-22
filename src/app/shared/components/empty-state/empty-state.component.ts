import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Inbox } from 'lucide-angular';
import { FwButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-fw-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwButtonComponent],
  template: `
    <div class="fw-empty-state animate-fade" [class.compact]="density === 'compact'">
      <!-- Icon Container -->
      <div class="icon-box" *ngIf="icon">
        <lucide-icon [name]="icon" [size]="density === 'compact' ? 32 : 48"></lucide-icon>
      </div>

      <!-- Text Content -->
      <div class="text-zone">
        <h3 class="state-title">{{ title }}</h3>
        <p class="state-desc" *ngIf="description">{{ description }}</p>
      </div>

      <!-- Actions -->
      <div class="action-zone" *ngIf="ctaLabel">
        <app-fw-button (click)="ctaClick.emit()" [variant]="'primary'" [size]="density === 'compact' ? 'sm' : 'md'">
          {{ ctaLabel }}
        </app-fw-button>
      </div>
    </div>
  `,
  styles: [`
    .fw-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: calc(var(--fw-space-xl) * 2) var(--fw-space-lg);
      text-align: center;
      background: var(--fw-surface-card);
      border: 2px dashed var(--fw-border);
      border-radius: var(--fw-radius-lg);
      transition: var(--fw-transition);

      &.compact {
        padding: var(--fw-space-xl) var(--fw-space-md);
        border-radius: var(--fw-radius-md);
        
        .icon-box { margin-bottom: 1rem; width: 56px; height: 56px; }
        .state-title { font-size: 1rem; }
        .text-zone { margin-bottom: 1rem; }
      }
    }

    .icon-box {
      width: 80px;
      height: 80px;
      border-radius: var(--fw-radius-xl);
      background: var(--fw-surface-sunken);
      color: var(--fw-text-tertiary);
      display: grid;
      place-items: center;
      margin-bottom: 1.5rem;
    }

    .text-zone {
      max-width: 440px;
      margin-bottom: 2rem;

      .state-title {
        font-family: var(--fw-font-display);
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--fw-text-primary);
        margin: 0 0 0.5rem 0;
      }

      .state-desc {
        font-size: 0.875rem;
        color: var(--fw-text-secondary);
        line-height: 1.6;
        margin: 0;
      }
    }

    .animate-fade {
      animation: fw-fade-up 0.4s ease-out;
    }

    @keyframes fw-fade-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FwEmptyStateComponent {
  @Input() icon: any = Inbox;
  @Input() title: string = 'Aucune donnée';
  @Input() description?: string;
  @Input() ctaLabel?: string;
  @Input() density: 'comfortable' | 'compact' = 'comfortable';

  @Output() ctaClick = new EventEmitter<void>();
}
