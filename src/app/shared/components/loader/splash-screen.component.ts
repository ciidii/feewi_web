import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'fw-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-overlay" [class.fade-out]="fadeOut">
      <div class="splash-content">
        <div class="logo-wrapper">
          <img src="feewi-icon.svg" alt="Feewi" class="logo-icon">
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
      transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);

      &.fade-out { opacity: 0; pointer-events: none; }
    }

    .splash-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3rem;
    }

    .logo-wrapper {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .logo-icon {
      width: 100%;
      height: auto;
      /* Animation de respiration et flottement Premium */
      animation: fw-logo-float 3s infinite ease-in-out;
      will-change: transform, filter;
    }

    .status-zone {
      text-align: center;
      width: 220px;
    }

    .status-text {
      font-family: var(--fw-font-display);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--fw-text-tertiary);
      margin-bottom: 1.25rem;
      opacity: 0.8;
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
      animation: fw-progress-indet 1.5s infinite cubic-bezier(0.65, 0.815, 0.735, 0.395);
    }

    @keyframes fw-logo-float {
      0% {
        transform: translateY(0) scale(1);
        filter: drop-shadow(0 5px 15px rgba(0, 82, 255, 0.1));
      }
      50% {
        transform: translateY(-6px) scale(1.02);
        filter: drop-shadow(0 20px 25px rgba(0, 82, 255, 0.2));
      }
      100% {
        transform: translateY(0) scale(1);
        filter: drop-shadow(0 5px 15px rgba(0, 82, 255, 0.1));
      }
    }

    @keyframes fw-progress-indet {
      0% { transform: translateX(-100%) scaleX(0.2); }
      50% { transform: translateX(0%) scaleX(0.5); }
      100% { transform: translateX(100%) scaleX(0.2); }
    }
  `]
})
export class SplashScreenComponent {
  @Input() message: string = 'Connexion à Feewi';
  @Input() fadeOut: boolean = false;
}
