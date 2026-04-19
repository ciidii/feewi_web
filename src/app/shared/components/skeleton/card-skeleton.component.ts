import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'fw-card-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="card-skeleton-container" [ngClass]="{'compact': density === 'compact'}">
      <!-- Header with avatar and name -->
      <div class="flex items-center gap-3 mb-4">
        <fw-skeleton shape="circle" width="40px" height="40px"></fw-skeleton>
        <div class="flex-1 space-y-2">
          <fw-skeleton width="60%" height="14px"></fw-skeleton>
          <fw-skeleton width="40%" height="10px"></fw-skeleton>
        </div>
      </div>

      <!-- Body lines -->
      <div class="space-y-3">
        <fw-skeleton width="100%" height="12px"></fw-skeleton>
        <fw-skeleton width="90%" height="12px"></fw-skeleton>
        <fw-skeleton width="75%" height="12px"></fw-skeleton>
      </div>

      <!-- Footer action -->
      <div class="mt-6 flex justify-end">
        <fw-skeleton shape="pill" width="80px" height="32px"></fw-skeleton>
      </div>
    </div>
  `,
  styles: [`
    .card-skeleton-container {
      padding: var(--fw-space-lg);
      background: var(--fw-surface-card);
      border: 1px solid var(--fw-border);
      border-radius: var(--fw-radius-lg);
    }

    .card-skeleton-container.compact {
      padding: var(--fw-space-md);
      border-radius: var(--fw-radius-md);
    }
  `]
})
export class CardSkeletonComponent {
  @Input() density: 'comfortable' | 'compact' = 'comfortable';
}
