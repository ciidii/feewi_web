import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'fw-card-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="feewi-card-skeleton" [ngClass]="{'compact': density === 'compact'}">
      <!-- Header Glass Mockup -->
      <div class="card-glass-header-mock"></div>

      <!-- Avatar Squircle Mockup -->
      <div class="squircle-mock">
        <fw-skeleton radius="16px" width="52px" height="52px"></fw-skeleton>
      </div>

      <!-- Body -->
      <div class="card-body-mock">
        <div class="title-section-mock">
          <fw-skeleton width="70%" height="16px" class="mb-2"></fw-skeleton>
          <fw-skeleton width="90%" height="12px"></fw-skeleton>
        </div>

        <div class="badge-container-mock">
          <fw-skeleton shape="pill" width="60px" height="18px"></fw-skeleton>
          <fw-skeleton shape="pill" width="80px" height="18px"></fw-skeleton>
        </div>

        <div class="metadata-grid-mock">
          <div class="meta-item-mock" *ngFor="let i of [1,2,3,4]">
            <fw-skeleton shape="circle" width="14px" height="14px"></fw-skeleton>
            <fw-skeleton width="60%" height="10px"></fw-skeleton>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="card-footer-mock">
        <fw-skeleton width="40px" height="10px"></fw-skeleton>
        <div class="flex gap-2">
          <fw-skeleton shape="rect" radius="8px" width="28px" height="28px"></fw-skeleton>
          <fw-skeleton shape="rect" radius="8px" width="28px" height="28px"></fw-skeleton>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feewi-card-skeleton {
      background: white;
      border-radius: 12px; /* Standardis├® 12px */
      border: 1px solid var(--fw-border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-glass-header-mock {
      height: 48px;
      background: var(--fw-raw-slate-50);
      border-bottom: 1px solid var(--fw-border);
    }

    .squircle-mock {
      margin-top: -24px;
      margin-left: 1.25rem;
      z-index: 2;
    }

    .card-body-mock {
      padding: 1rem 1.25rem;
      flex: 1;
    }

    .title-section-mock {
      margin-bottom: 0.75rem;
    }

    .badge-container-mock {
      display: flex;
      gap: 0.375rem;
      margin-bottom: 1rem;
    }

    .metadata-grid-mock {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--fw-surface-sunken);
    }

    .meta-item-mock {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      height: 1.25rem;
    }

    .card-footer-mock {
      padding: 0.625rem 1.25rem;
      background: var(--fw-surface-sunken);
      border-top: 1px solid var(--fw-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .mb-2 { margin-bottom: 0.5rem; }
  `]
})
export class CardSkeletonComponent {
  @Input() density: 'comfortable' | 'compact' = 'comfortable';
}
