import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {TenantContextService} from '../../../core/services/tenant-context.service';
import {APP_PATHS} from '../../../core/constants/app-paths';

@Component({
  selector: 'app-fw-public-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="public-footer">
      <div class="container">
        <div class="footer-brand">
          <span class="footer-school">{{ tenantCtx.activeTenant()?.name ?? 'Établissement' }}</span>
          <span class="footer-tagline">Excellence & Modernité</span>
        </div>

        <nav class="footer-nav">
          <a [routerLink]="paths.PUBLIC.HOME">Accueil</a>
          <a [routerLink]="paths.PUBLIC.RESULTS">Résultats</a>
          <a [routerLink]="paths.PUBLIC.GALLERY">Galerie</a>
          <a [routerLink]="paths.PUBLIC.PRICING">Tarifs & Services</a>
          <a [routerLink]="paths.PUBLIC.ADMISSIONS_HOME">Admissions</a>
        </nav>

        <span class="footer-powered">Propulsé par <strong>Feewi Education</strong></span>
      </div>
    </footer>
  `,
  styles: [`
    .public-footer {
      background: var(--fw-surface-card);
      border-top: 1px solid var(--fw-border);
      padding: 32px 0;
      font-family: var(--fw-font-sans);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .footer-school { font-size: 13px; font-weight: 700; color: var(--fw-text-primary); }
    .footer-tagline { font-size: 11px; color: var(--fw-text-tertiary); }

    .footer-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;

      a {
        font-size: 12px;
        font-weight: 600;
        color: var(--fw-text-secondary);
        text-decoration: none;

        &:hover { color: var(--fw-primary); }
      }
    }

    .footer-powered {
      font-size: 11px;
      color: var(--fw-text-secondary);
      strong { color: var(--fw-text-primary); font-weight: 800; }
    }

    @media (max-width: 640px) {
      .container { flex-direction: column; text-align: center; }
    }
  `]
})
export class FwPublicFooterComponent {
  tenantCtx = inject(TenantContextService);
  readonly paths = APP_PATHS;
}
