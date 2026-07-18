import {inject} from '@angular/core';
import {RedirectCommand, ResolveFn, Router} from '@angular/router';
import {catchError, of} from 'rxjs';
import {TenantResolverService} from '../services/tenant-resolver.service';
import {Tenant} from '../services/tenant-context.service';

/**
 * Résout le tenant public avant d'activer le shell public.
 * Redirige vers /ecole-introuvable si aucun slug n'est résolvable ou si l'école n'existe pas.
 */
export const tenantResolver: ResolveFn<Tenant | RedirectCommand> = (route) => {
  const tenantResolverService = inject(TenantResolverService);
  const router = inject(Router);

  const notFoundRedirect = () => new RedirectCommand(router.parseUrl('/ecole-introuvable'));

  const queryParamSlug = route.queryParamMap.get('tenant');
  const desiredSlug = tenantResolverService.resolveDesiredSlug(queryParamSlug);

  if (!desiredSlug) {
    return of(notFoundRedirect());
  }

  return tenantResolverService.ensureTenant(desiredSlug).pipe(
    catchError(() => of(notFoundRedirect()))
  );
};
