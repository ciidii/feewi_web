import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'fw-block-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="block-loader" [class.absolute-center]="center">
      <div class="spinner-dot"></div>
      <p *ngIf="message" class="loader-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .block-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
    }

    .block-loader.absolute-center {
      position: absolute;
      inset: 0;
      justify-content: center;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(4px);
      z-index: 100;
    }

    .spinner-dot {
      width: 32px;
      height: 32px;
      border: 2px solid var(--fw-border);
      border-top-color: var(--fw-primary);
      border-radius: 50%;
      animation: fw-spin 0.6s linear infinite;
    }

    .loader-message {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--fw-text-secondary);
      letter-spacing: 0.02em;
    }

    @keyframes fw-spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class BlockLoaderComponent {
  @Input() message?: string;
  @Input() center: boolean = false;
}
