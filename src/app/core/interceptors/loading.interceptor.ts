import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../../shared/services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Optional bypass for requests that should not trigger the global loader.
  if (req.headers.has('x-skip-loader')) {
    const cleanReq = req.clone({ headers: req.headers.delete('x-skip-loader') });
    return next(cleanReq);
  }

  loadingService.start();

  return next(req).pipe(
    finalize(() => {
      loadingService.stop();
    })
  );
};
