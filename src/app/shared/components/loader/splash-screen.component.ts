import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fw-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-overlay" [class.fade-out]="fadeOut">
      <div class="splash-content">
        <div class="logo-container">
          <div class="pulse-ring"></div>
          <img src="public/feewi-logo-electric.svg" alt="Feewi" class="logo">
        </div>
        
        <div class="status-zone">
          <p class="status-text">{{ message }}</p>
          <div class="progress-track">
            <div class="progress-bar"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .splash-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: var(--fw-surface-page);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.4s ease-out;
      
      &.fade-out { opacity: 0; pointer-events: none; }
    }

    .splash-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2.5rem;
    }

    .logo-container {
      position: relative;
      width: 96px;
      height: 96px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo {
      width: 100%;
      height: auto;
      z-index: 2;
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: var(--fw-primary);
      opacity: 0.15;
      animation: fw-pulse 2.5s infinite ease-out;
    }

    .status-zone {
      text-align: center;
      width: 240px;
    }

    .status-text {
      font-family: var(--fw-font-display);
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--fw-text-tertiary);
      margin-bottom: 1rem;
    }

    .progress-track {
      width: 100%;
      height: 2px;
      background: var(--fw-surface-sunken);
      border-radius: var(--fw-radius-full);
      overflow: hidden;
    }

    .progress-bar {
      width: 100%;
      height: 100%;
      background: var(--fw-primary);
      transform-origin: left;
      animation: fw-progress-indet 1.8s infinite cubic-bezier(0.65, 0.815, 0.735, 0.395);
    }

    @keyframes fw-pulse {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    @keyframes fw-progress-indet {
      0% { transform: translateX(-100%) scaleX(0.2); }
      50% { transform: translateX(0%) scaleX(0.5); }
      100% { transform: translateX(100%) scaleX(0.2); }
    }
  `]
})
export class SplashScreenComponent {
  @Input() message: string = 'Initialisation';
  @Input() fadeOut: boolean = false;
}
