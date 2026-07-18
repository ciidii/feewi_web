import {inject, Injectable} from '@angular/core';
import {map, Observable, of} from 'rxjs';
import {SchoolService} from './school.service';
import {Tenant, TenantContextService} from './tenant-context.service';
import {EnvironmentService} from './environment.service';

const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin'];
const DEV_OVERRIDE_KEY = 'dev_tenant_override';

/**
 * Résout le tenant (école) actif du portail public.
 * - Prod : le slug est lu depuis le sous-domaine (résolution réelle faite côté backend via le Host header).
 * - Dev : cascade query param `?tenant=` -> override localStorage -> environment.devTenantSlug.
 */
@Injectable({
  providedIn: 'root',
})
export class TenantResolverService {
  private schoolService = inject(SchoolService);
  private tenantContext = inject(TenantContextService);
  private envService = inject(EnvironmentService);

  /**
   * Calcule le slug d'école désiré pour la navigation en cours.
   * `queryParamSlug` provient de `?tenant=<slug>` sur l'URL courante (dev uniquement).
   */
  resolveDesiredSlug(queryParamSlug?: string | null): string | null {
    if (this.envService.isProduction()) {
      return this.extractSubdomainSlug(window.location.hostname);
    }

    if (queryParamSlug) {
      localStorage.setItem(DEV_OVERRIDE_KEY, queryParamSlug);
      return queryParamSlug;
    }

    const override = localStorage.getItem(DEV_OVERRIDE_KEY);
    if (override) {
      return override;
    }

    return this.envService.config.devTenantSlug || null;
  }

  private extractSubdomainSlug(hostname: string): string | null {
    const parts = hostname.split('.');
    if (parts.length < 3) {
      // Pas de sous-domaine exploitable (ex: "feewi.com", "localhost")
      return null;
    }
    const subdomain = parts[0];
    return RESERVED_SUBDOMAINS.includes(subdomain) ? null : subdomain;
  }

  /**
   * Garantit que le tenant actif correspond au slug désiré, en le rechargeant
   * uniquement si nécessaire (le cache localStorage n'est jamais présumé fiable
   * en dev, où un seul localStorage est partagé entre plusieurs "écoles simulées").
   */
  ensureTenant(desiredSlug: string): Observable<Tenant> {
    const current = this.tenantContext.activeTenant();
    if (current && current.id === desiredSlug) {
      return of(current);
    }

    return this.schoolService.getPublicSchoolInfo(desiredSlug).pipe(
      map(school => {
        const tenant: Tenant = {
          id: school.tenantId,
          name: school.name,
          logoUrl: school.logoUrl,
          allowedCycles: ['PRIMAIRE', 'COLLEGE', 'LYCEE'], // Valeurs par défaut tant que le backend ne les expose pas publiquement
        };
        this.tenantContext.setTenant(tenant);
        return tenant;
      })
    );
  }
}
