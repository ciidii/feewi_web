import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  // On clone la requête pour ajouter le Bearer Token si présent
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gestion des erreurs standard (Section 5 du Guide)
      if (error.status === 401) {
        localStorage.removeItem('access_token');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
