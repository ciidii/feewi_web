import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'fw-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fw-skeleton"
      [ngClass]="shape"
      [style.width]="width"
      [style.height]="height"
      [style.borderRadius]="radius"
    >
      <div class="shimmer-wrapper"></div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }

    .fw-skeleton {
      position: relative;
      overflow: hidden;
      background-color: var(--fw-skeleton-bg);

      &.circle { border-radius: 50% !important; }
      &.pill { border-radius: var(--fw-radius-full) !important; }
      &.rect { border-radius: var(--fw-radius-md); }

      .shimmer-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--fw-skeleton-shimmer);
        animation: fw-shimmer 2s infinite linear;
      }
    }
  `]
})
export class SkeletonComponent {
  /** 'circle', 'pill' or 'rect' */
  @Input() shape: 'circle' | 'pill' | 'rect' = 'rect';

  /** Width (e.g., '100%', '48px') */
  @Input() width: string = '100%';

  /** Height (e.g., '1rem', '48px') */
  @Input() height: string = '1rem';

  /** Custom border radius if not using shapes */
  @Input() radius?: string;
}
