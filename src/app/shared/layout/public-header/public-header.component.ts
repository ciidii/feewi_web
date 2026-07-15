import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {GraduationCap, LogIn, LucideAngularModule, Search, ShieldCheck} from 'lucide-angular';
import {TenantContextService} from '../../../core/services/tenant-context.service';
import {APP_PATHS} from '../../../core/constants/app-paths';

@Component({
  selector: 'app-fw-public-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <header class="public-header">
      <div class="container">
        <!-- Brand -->
        <div class="brand" [routerLink]="paths.PUBLIC.HOME">
          <div class="brand-logo">
            <img *ngIf="tenantCtx.activeTenant()?.logoUrl" [src]="tenantCtx.activeTenant()?.logoUrl">
            <lucide-icon *ngIf="!tenantCtx.activeTenant()?.logoUrl" [name]="GraduationCap" [size]="20"></lucide-icon>
          </div>
          <div class="brand-info">
            <span class="brand-name">{{ tenantCtx.activeTenant()?.name || 'PORTAIL ÉCOLE' }}</span>
            <span class="brand-tagline">Système de gestion scolaire</span>
          </div>
        </div>

        <!-- Navigation Desktop -->
        <nav class="header-nav">
          <a [routerLink]="paths.PUBLIC.HOME" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            Accueil
          </a>
          <a [routerLink]="paths.PUBLIC.RESULTS" routerLinkActive="active" class="nav-link">
            Résultats
          </a>
          <a [routerLink]="paths.PUBLIC.GALLERY" routerLinkActive="active" class="nav-link">
            Galerie
          </a>
          <a [routerLink]="paths.PUBLIC.PRICING" routerLinkActive="active" class="nav-link">
            Tarifs
          </a>
          <a [routerLink]="paths.PUBLIC.ADMISSIONS_HOME" routerLinkActive="active" class="nav-link">
            Admissions
          </a>
          <a [routerLink]="paths.PUBLIC.ADMISSIONS_TRACKER" routerLinkActive="active" class="nav-link">
            <lucide-icon [name]="Search" [size]="14"></lucide-icon>
            Suivre un dossier
          </a>
        </nav>

        <!-- Right Side -->
        <div class="header-actions">
           <div class="portal-badge">
             <lucide-icon [name]="ShieldCheck" [size]="14"></lucide-icon>
             <span>Officiel</span>
           </div>
           <a [routerLink]="paths.AUTH.LOGIN" class="parent-space-btn">
             <lucide-icon [name]="LogIn" [size]="14"></lucide-icon>
             <span>Espace Parent</span>
           </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .public-header {
      height: 72px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--fw-border);
      position: sticky;
      top: 0;
      z-index: 1000;
      font-family: var(--fw-font-sans);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;

      .brand-logo {
        width: 40px;
        height: 40px;
        background: var(--fw-surface-inverse);
        color: var(--fw-text-inverse);
        border-radius: 10px;
        display: grid;
        place-items: center;
        overflow: hidden;
        img { width: 100%; height: 100%; object-fit: cover; }
      }

      .brand-info {
        display: flex;
        flex-direction: column;
        .brand-name { font-family: var(--fw-font-display); font-weight: 800; font-size: 0.9375rem; color: var(--fw-text-primary); letter-spacing: -0.02em; line-height: 1.1; }
        .brand-tagline { font-size: 10px; font-weight: 600; color: var(--fw-text-tertiary); text-transform: uppercase; letter-spacing: 0.02em; }
      }
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 22px;

      .nav-link {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--fw-text-secondary);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: color 0.2s ease;

        &:hover { color: var(--fw-primary); }
        &.active { color: var(--fw-primary); }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .portal-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--fw-surface-sunken);
      border-radius: var(--fw-radius-full);
      font-size: 10px;
      font-weight: 800;
      color: var(--fw-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      lucide-icon { color: var(--fw-primary); }
    }

    .parent-space-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--fw-primary);
      color: white;
      border-radius: var(--fw-radius-full);
      font-size: 0.8125rem;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.2s ease;

      &:hover { opacity: 0.85; }
    }

    @media (max-width: 480px) {
      .parent-space-btn span { display: none; }
    }

    @media (max-width: 768px) {
      .header-nav { display: none; }
      .brand-tagline { display: none; }
    }
  `]
})
export class FwPublicHeaderComponent {
  tenantCtx = inject(TenantContextService);
  readonly paths = APP_PATHS;

  readonly GraduationCap = GraduationCap;
  readonly Search = Search;
  readonly ShieldCheck = ShieldCheck;
  readonly LogIn = LogIn;
}
