import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TenantContextService } from '../services/tenant-context.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tenantService = inject(TenantContextService);
  const token = localStorage.getItem('access_token');
  const activeTenantId = tenantService.activeTenant()?.id;

  // On clone la requête pour ajouter le Bearer Token et le Tenant ID
  let authReq = req;
  const headers: { [name: string]: string } = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (activeTenantId) {
    headers['X-Tenant-ID'] = activeTenantId;
  }

  if (Object.keys(headers).length > 0) {
    authReq = req.clone({ setHeaders: headers });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gestion des erreurs standard (Section 5 du Guide)
      if (error.status === 401) {
        console.warn('[tenantInterceptor] 401 Unauthorized detected. Clearing session.');
        localStorage.removeItem('access_token');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
