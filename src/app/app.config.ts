import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, TitleStrategy} from '@angular/router';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideHttpClient, withInterceptors} from '@angular/common/http';

import {routes} from './app.routes';
import {authInterceptor} from './core/interceptors/auth.interceptor';
import {tenantInterceptor} from './core/interceptors/tenant.interceptor';
import {loadingInterceptor} from './core/interceptors/loading.interceptor';
import {AuthService} from './core/services/auth.service';
import {provideToastr} from 'ngx-toastr';
import {PageTitleStrategy} from './core/services/page-title-strategy.service';
import {ENVIRONMENT_CONFIG} from '../environments/environment.interface';
import {environment} from '../environments/environment';

import {catchError, of} from 'rxjs';
import {ToastComponent} from './shared/components/toast/toast';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader, TranslateHttpLoader} from '@ngx-translate/http-loader';

// Initialiseur pour charger la langue avant le rendu
export function initTranslation(translate: TranslateService) {
  return () => {
    const savedLang = localStorage.getItem('feewi_lang');
    const browserLang = translate.getBrowserLang();
    const langToUse = savedLang || (browserLang?.match(/fr|en/) ? browserLang : 'fr');
    translate.setDefaultLang('fr');
    return translate.use(langToUse).pipe(
      catchError(() => of(null)) // Ne pas bloquer l'app si le fichier i18n échoue
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor, tenantInterceptor])),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader
        }
      })
    ),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslation,
      deps: [TranslateService],
      multi: true
    },
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
      useFactory: (authService: AuthService) => () => authService.checkSession().pipe(
        catchError(() => of(false)) // On ne bloque jamais le boot
      ),
      deps: [AuthService],
      multi: true
    },
    provideToastr({
      toastComponent: ToastComponent,
      timeOut: 4000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
      newestOnTop: true,
      tapToDismiss: true
    })
  ]
};
