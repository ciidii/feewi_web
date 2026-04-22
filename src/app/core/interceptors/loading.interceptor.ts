import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, delay } from 'rxjs/operators';
import { LoadingService } from '../../shared/services/loading.service';
import { isDevMode } from '@angular/core';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Éviter de déclencher le loader pour certaines requêtes si nécessaire
  if (req.headers.has('x-skip-loader')) {
    const cleanReq = req.clone({ headers: req.headers.delete('x-skip-loader') });
    return next(cleanReq);
  }

  // On détermine le contexte de chargement
  // 'page' déclenche le loader YouTube-style en haut de page
  // 'global' déclenche le splash screen (utilisé pour les actions lourdes)
  const context = req.method === 'GET' ? 'page' : 'global';
  
  loadingService.start(context);

  // En mode développement, on ajoute un délai artificiel pour voir les loaders
  const simulatedDelay = isDevMode() ? 1000 : 0;

  return next(req).pipe(
    delay(simulatedDelay),
    finalize(() => {
      loadingService.stop();
    })
  );
};
