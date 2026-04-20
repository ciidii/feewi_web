import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fw-page-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-track">
      <div class="progress-bar">
        <div class="progress-glow"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 9999;
      pointer-events: none;
    }

    .progress-track {
      width: 100%;
      height: 100%;
      background: rgba(59, 130, 246, 0.1);
      overflow: hidden;
    }

    .progress-bar {
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, 
        #2563eb, 
        #3b82f6, 
        #60a5fa, 
        #3b82f6, 
        #2563eb
      );
      background-size: 200% 100%;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
      animation: 
        progress-slide 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite,
        progress-gradient 1.5s linear infinite;
      transform-origin: left;
    }

    .progress-glow {
      position: absolute;
      top: 0;
      right: 0;
      width: 150px;
      height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
      filter: blur(4px);
    }

    @keyframes progress-slide {
      0% { transform: scaleX(0) translateX(0); }
      40% { transform: scaleX(0.4) translateX(50%); }
      100% { transform: scaleX(0) translateX(250%); }
    }

    @keyframes progress-gradient {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class PageProgressComponent {}
