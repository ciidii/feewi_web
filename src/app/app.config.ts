import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './core/services/auth.service';
import {provideToastr} from 'ngx-toastr';
import { TitleStrategy } from '@angular/router';
import { PageTitleStrategy } from './core/services/page-title-strategy.service';
import { ENVIRONMENT_CONFIG } from '../environments/environment.interface';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([loadingInterceptor, tenantInterceptor])),
    {
      provide: ENVIRONMENT_CONFIG,
      useValue: environment
    },
    {
      provide: TitleStrategy,
      useClass: PageTitleStrategy
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.checkSession(),
      deps: [AuthService],
      multi: true
    },
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      progressAnimation: 'increasing',
      closeButton: true,
      newestOnTop: true,
      tapToDismiss: true
    })
  ]
};
