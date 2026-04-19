import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fw-page-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-track">
      <div class="progress-indicator"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 100;
    }

    .progress-track {
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
    }

    .progress-indicator {
      width: 40%;
      height: 100%;
      background: var(--fw-primary);
      box-shadow: 0 0 10px var(--fw-primary-alpha);
      animation: progress-moving 1.5s infinite ease-in-out;
    }

    @keyframes progress-moving {
      0% { transform: translateX(-110%); }
      100% { transform: translateX(250%); }
    }
  `]
})
export class PageProgressComponent {}
