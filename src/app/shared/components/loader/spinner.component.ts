import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fw-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="fw-spinner" 
      [style.width]="size" 
      [style.height]="size"
      [style.borderWidth]="stroke"
      [class.primary]="variant === 'primary'"
      [class.white]="variant === 'white'"
      [class.secondary]="variant === 'secondary'"
    ></div>
  `,
  styles: [`
    .fw-spinner {
      border-style: solid;
      border-color: var(--fw-border-light);
      border-radius: 50%;
      animation: fw-spin 0.6s linear infinite;
      display: inline-block;
      vertical-align: middle;
    }

    .fw-spinner.primary {
      border-top-color: var(--fw-primary);
    }

    .fw-spinner.white {
      border-color: rgba(255, 255, 255, 0.2);
      border-top-color: white;
    }

    .fw-spinner.secondary {
      border-top-color: var(--fw-text-secondary);
    }

    @keyframes fw-spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {
  /** Size of the spinner (e.g., '16px', '2rem') */
  @Input() size: string = '24px';

  /** Stroke width of the spinner */
  @Input() stroke: string = '2px';

  /** Visual variant */
  @Input() variant: 'primary' | 'white' | 'secondary' = 'primary';
}
