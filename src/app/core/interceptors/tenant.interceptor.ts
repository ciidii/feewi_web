import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TenantContextService } from '../services/tenant-context.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantContextService);
  
  // 1. Déterminer si c'est une requête vers une API Feewi
  const isApiRequest = req.url.includes('/api/v1');
  const isLoginRequest = req.url.includes('/auth/login');
  
  if (!isApiRequest) return next(req);

  const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
  const activeTenantId = tenantService.activeTenant()?.id;

  // 2. Préparer les headers
  const headers: { [name: string]: string } = {};

  // N'ajouter le token que s'il existe ET que ce n'est pas une requête de login
  if (token && !isLoginRequest) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Toujours ajouter le Tenant ID s'il est connu
  if (activeTenantId) {
    headers['X-Tenant-Id'] = activeTenantId;
  }

  // 3. Cloner et envoyer
  const authReq = req.clone({ setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // GESTION PROFESSIONNELLE DES ERREURS
      // On logue l'erreur mais on ne force JAMAIS de redirection ici.
      // La redirection est gérée par les Guards ou les composants.
      if (error.status === 401) {
        console.warn(`[Security] 401 Unauthorized détecté sur: ${req.url}`);
      }
      return throwError(() => error);
    })
  );
};
