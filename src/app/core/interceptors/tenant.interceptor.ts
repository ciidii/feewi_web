import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TenantContextService } from '../services/tenant-context.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantContextService);
  
  // 1. Déterminer si c'est une requête vers une API Feewi
  const isApiRequest = req.url.includes('/api/v1');
  
  if (!isApiRequest) return next(req);

  const activeTenantId = tenantService.activeTenant()?.id;

  // 2. Préparer les headers
  const headers: { [name: string]: string } = {};

  // Toujours ajouter le Tenant ID s'il est connu
  if (activeTenantId) {
    headers['X-Tenant-Id'] = activeTenantId;
  }

  // 3. Cloner et envoyer
  const authReq = req.clone({ setHeaders: headers });

  return next(authReq);
};
