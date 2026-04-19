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
  // Si c'est une requête de données (GET), on utilise 'component' (Skeletons)
  // Si c'est une action (POST/PATCH/DELETE), on pourrait utiliser 'global' ou laisser le composant gérer
  const context = req.method === 'GET' ? 'component' : 'global';
  
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
