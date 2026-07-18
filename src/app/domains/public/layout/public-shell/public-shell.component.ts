import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {FwPublicHeaderComponent} from '../../../../shared/layout/public-header/public-header.component';
import {FwPublicFooterComponent} from '../../../../shared/layout/public-footer/public-footer.component';
import {DevTenantSwitcherComponent} from '../../../../shared/components/dev-tenant-switcher/dev-tenant-switcher.component';
import {EnvironmentService} from '../../../../core/services/environment.service';

/**
 * Shell commun à toute la zone publique (vitrine + admission) : header et footer partagés,
 * cohérents sur toutes les pages. Le tenant actif est déjà résolu et peuplé par `tenantResolver`
 * avant l'activation de cette route — les pages enfants le lisent directement, de façon synchrone.
 */
@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FwPublicHeaderComponent, FwPublicFooterComponent, DevTenantSwitcherComponent],
  template: `
    <app-fw-public-header />
    <router-outlet />
    <app-fw-public-footer />
    <app-dev-tenant-switcher *ngIf="!envService.isProduction()" />
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--fw-surface-page);
    }
  `]
})
export class PublicShellComponent {
  envService = inject(EnvironmentService);
}
