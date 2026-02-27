import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantContextService } from '../services/tenant-context.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantContextService);
  const activeTenant = tenantService.activeTenant();

  // On récupère le token du localStorage (simulé pour l'instant)
  const authToken = localStorage.getItem('auth_token') || '';

  // On clone la requête pour y ajouter les headers
  let authReq = req.clone({
    setHeaders: {
      'Authorization': `Bearer ${authToken}`,
      'X-Tenant-ID': activeTenant?.id || 'default-school'
    }
  });

  return next(authReq);
};
