import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, throwError} from 'rxjs';
import {Router} from '@angular/router';

/**
 * Intercepteur pour ajouter le token d'authentification Bearer
 * aux requêtes sortantes vers l'API.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // 1. Récupérer le token depuis le stockage local ou de session
  const localToken = localStorage.getItem('access_token');
  const sessionToken = sessionStorage.getItem('access_token');
  const token = localToken ?? sessionToken;

  if (token) {
    console.debug(`[AuthInterceptor] Token found in ${localToken ? 'localStorage' : 'sessionStorage'}`);
  } else {
    console.debug(`[AuthInterceptor] No token found in any storage`);
  }

  // 2. Vérifier si c'est une requête vers l'API et non une requête publique/anonyme
  // On utilise une vérification plus robuste
  const isApiRequest = req.url.includes('/api/v1');
  const isLoginRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');
  // Les routes "/public/" (config d'admission, vitrine école, etc.) sont permitAll() côté
  // backend, mais un Bearer token présent-mais-invalide/expiré fait échouer l'authentification
  // AVANT même l'évaluation de permitAll() (comportement Spring Security OAuth2 Resource
  // Server) — d'où un 401 sur une route censée être anonyme. On n'attache donc jamais de
  // token à ces routes, qu'il soit valide ou non : elles n'en ont jamais besoin.
  const isPublicRequest = req.url.includes('/public/');

  let authReq = req;

  if (isApiRequest && token && !isLoginRequest && !isPublicRequest) {
    console.debug(`[AuthInterceptor] Adding token to request: ${req.url}`);
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn(`[AuthInterceptor] 401 Unauthorized détecté sur: ${req.url}`);
        // Optionnel: On pourrait déclencher un logout ici si le token est expiré
        // Mais il est préférable de laisser AuthService ou les Guards gérer cela
      }
      return throwError(() => error);
    })
  );
};
