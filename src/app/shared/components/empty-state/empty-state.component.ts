import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {FwButtonComponent} from '../button/button.component';

@Component({
  selector: 'app-fw-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwButtonComponent],
  template: `
    <div class="empty-state animate-fade">
      <div class="icon-container" *ngIf="icon">
        <lucide-icon [name]="icon" [size]="48"></lucide-icon>
      </div>

      <div class="text-content">
        <h3 class="title">{{ title }}</h3>
        <p class="description" *ngIf="description">{{ description }}</p>
      </div>

      <div class="actions" *ngIf="ctaLabel">
        <app-fw-button (click)="ctaClick.emit()" variant="primary">
          {{ ctaLabel }}
        </app-fw-button>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: var(--fw-radius-xl);
      border: 2px dashed var(--fw-border);
    }

    .icon-container {
      width: 80px;
      height: 80px;
      border-radius: var(--fw-radius-xl);
      background: var(--fw-surface-sunken);
      color: var(--fw-slate-medium);
      display: grid;
      place-items: center;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }

    .text-content {
      max-width: 400px;
      margin-bottom: 2rem;

      .title {
        font-family: var(--fw-font-display);
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--fw-midnight);
        margin: 0 0 0.5rem 0;
      }

      .description {
        font-size: 0.875rem;
        color: var(--fw-text-secondary);
        line-height: 1.6;
        margin: 0;
      }
    }

    .animate-fade {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FwEmptyStateComponent {
  @Input() icon?: any;
  @Input() title!: string;
  @Input() description?: string;
  @Input() ctaLabel?: string;

  @Output() ctaClick = new EventEmitter<void>();
}
