import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FlaskConical, LucideAngularModule, X} from 'lucide-angular';
import {TenantContextService} from '../../../core/services/tenant-context.service';

const DEV_OVERRIDE_KEY = 'dev_tenant_override';
const LAST_TENANT_KEY = 'last_tenant';

/**
 * Widget dev-only pour changer de tenant sans manipuler l'URL/localStorage à la main.
 * N'est jamais rendu en prod : `TenantResolverService` ignore de toute façon le query
 * param `?tenant=` en production (résolution par sous-domaine uniquement), ce composant
 * n'est donc affiché que via `*ngIf="!envService.isProduction()"` dans PublicShellComponent.
 */
@Component({
  selector: 'app-dev-tenant-switcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="dev-switcher" [class.expanded]="expanded()">
      <button class="toggle" (click)="expanded.set(!expanded())" [title]="expanded() ? 'Fermer' : 'Changer de tenant (dev)'">
        <lucide-icon [name]="expanded() ? XIcon : FlaskConical" [size]="16"></lucide-icon>
        <span *ngIf="!expanded()">{{ tenantCtx.activeTenant()?.id || 'aucun tenant' }}</span>
      </button>

      <div class="panel" *ngIf="expanded()">
        <p class="current">
          Tenant actif : <strong>{{ tenantCtx.activeTenant()?.id || '—' }}</strong>
        </p>
        <div class="row">
          <input
            type="text"
            placeholder="slug-ecole"
            [value]="inputSlug()"
            (input)="inputSlug.set($any($event.target).value)"
            (keydown.enter)="switchTenant()"
          />
          <button class="apply" (click)="switchTenant()">OK</button>
        </div>
        <button class="reset" (click)="resetTenant()">Réinitialiser (config par défaut)</button>
      </div>
    </div>
  `,
  styles: [`
    .dev-switcher {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 1200;
      font-family: var(--fw-font-sans);
    }

    .toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--fw-radius-full);
      background: var(--fw-midnight);
      color: white;
      border: none;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: var(--fw-shadow-lg);
    }

    .panel {
      margin-top: 8px;
      width: 240px;
      background: var(--fw-surface-card);
      border: 1px solid var(--fw-border);
      border-radius: var(--fw-radius-lg);
      box-shadow: var(--fw-shadow-lg);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .current {
      font-size: 11px;
      color: var(--fw-text-secondary);
      strong { color: var(--fw-text-primary); }
    }

    .row {
      display: flex;
      gap: 6px;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 6px 10px;
      border: 1px solid var(--fw-border);
      border-radius: var(--fw-radius-md);
      font-size: 12px;
    }

    .apply {
      padding: 6px 12px;
      border-radius: var(--fw-radius-md);
      border: none;
      background: var(--fw-primary);
      color: white;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .reset {
      padding: 6px 10px;
      border-radius: var(--fw-radius-md);
      border: 1px solid var(--fw-border);
      background: transparent;
      color: var(--fw-text-secondary);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;

      &:hover { color: var(--fw-error); border-color: var(--fw-error-border); }
    }
  `]
})
export class DevTenantSwitcherComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  tenantCtx = inject(TenantContextService);

  expanded = signal(false);
  inputSlug = signal('');

  switchTenant() {
    const slug = this.inputSlug().trim();
    if (!slug) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {tenant: slug},
      queryParamsHandling: 'merge',
    });
    this.expanded.set(false);
  }

  resetTenant() {
    localStorage.removeItem(DEV_OVERRIDE_KEY);
    localStorage.removeItem(LAST_TENANT_KEY);
    window.location.href = window.location.pathname;
  }

  readonly FlaskConical = FlaskConical;
  readonly XIcon = X;
}
