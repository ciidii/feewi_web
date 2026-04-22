import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fw-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fw-card" [class.no-padding]="noPadding" [class.hoverable]="hoverable">
      <div class="card-header" *ngIf="title">
        <div class="header-content">
          <h3 class="card-title">{{ title }}</h3>
          <p class="card-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <div class="header-actions">
          <ng-content select="[card-actions]"></ng-content>
        </div>
      </div>

      <div class="card-body">
        <ng-content></ng-content>
      </div>

      <div class="card-footer" *ngIf="hasFooter">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .fw-card {
      background: white;
      border: none;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      border-radius: 24px;
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &.hoverable:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: var(--fw-text-tertiary);
      }

      &.no-padding {
        .card-body { padding: 0; }
      }
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--fw-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;

      .card-title {
        font-family: var(--fw-font-display);
        font-size: 0.9375rem;
        font-weight: 800;
        color: var(--fw-midnight);
        margin: 0;
      }

      .card-subtitle {
        font-size: 0.8125rem;
        color: var(--fw-text-secondary);
        margin: 2px 0 0 0;
      }
    }

    .card-body {
      padding: 1.5rem;
    }

    .card-footer {
      padding: 1rem 1.5rem;
      background: var(--fw-raw-slate-50);
      border-top: 1px solid var(--fw-border);
    }
  `]
})
export class FwCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() noPadding = false;
  @Input() hoverable = false;
  @Input() hasFooter = false;
}
