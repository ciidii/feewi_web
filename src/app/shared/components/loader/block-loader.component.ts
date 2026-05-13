import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SpinnerComponent} from './spinner.component';

@Component({
  selector: 'fw-block-loader',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <div class="block-loader" [class.absolute-center]="center">
      <fw-spinner size="32px" stroke="2px" variant="primary"></fw-spinner>
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

    .loader-message {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--fw-text-secondary);
      letter-spacing: 0.02em;
    }
  `]
})
export class BlockLoaderComponent {
  @Input() message?: string;
  @Input() center: boolean = false;
}
