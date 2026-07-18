import {Routes} from '@angular/router';
import {AuthLayoutComponent} from './auth/layout/auth-layout.component';
import {PublicShellComponent} from './layout/public-shell/public-shell.component';
import {tenantResolver} from '../../core/resolvers/tenant.resolver';

export const PUBLIC_ROUTES: Routes = [
  // 1. Flux Authentification (Enveloppé dans AuthLayout) — staff/admin, pas de résolution tenant
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        title: 'auth.login.title',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'forgot-password',
        title: 'auth.forgot_password.title',
        loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        title: 'auth.reset_password.title',
        loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
        path: 'force-password-change',
        title: 'Sécurisation du compte',
        loadComponent: () => import('./features/auth/force-password-change/force-password-change.component').then(m => m.ForcePasswordChangeComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: '**',
        redirectTo: 'login'
      }
    ]
  },

  // 2. École introuvable — hors du sous-arbre résolu, pour éviter toute boucle de redirection
  {
    path: 'ecole-introuvable',
    loadComponent: () => import('./errors/tenant-not-found/tenant-not-found.component').then(m => m.TenantNotFoundComponent)
  },

  // 3. Vitrine école + Admissions (Portail Parent) — tenant résolu une seule fois pour tout le sous-arbre
  {
    path: '',
    component: PublicShellComponent,
    resolve: {tenant: tenantResolver},
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    children: [
      {
        path: '',
        loadComponent: () => import('./showcase/home/showcase-home.component').then(m => m.ShowcaseHomeComponent)
      },
      {
        path: 'resultats-examens',
        loadComponent: () => import('./showcase/results/showcase-results.component').then(m => m.ShowcaseResultsComponent)
      },
      {
        path: 'galerie',
        loadComponent: () => import('./showcase/gallery/showcase-gallery.component').then(m => m.ShowcaseGalleryComponent)
      },
      {
        path: 'tarifs',
        loadComponent: () => import('./showcase/pricing/showcase-pricing.component').then(m => m.ShowcasePricingComponent)
      },
      {
        path: 'admissions',
        children: [
          {
            path: '',
            loadComponent: () => import('./admissions/home/admissions-home.component').then(m => m.AdmissionsHomeComponent)
          },
          {
            path: 'form-stepper',
            loadComponent: () => import('./admissions/form-stepper/public-form-stepper.component').then(m => m.PublicFormStepperComponent)
          },
          {
            path: 'tracker',
            loadComponent: () => import('./admissions/tracker/public-tracker.component').then(m => m.PublicTrackerComponent)
          },
          {
            path: 'tracker/:id',
            loadComponent: () => import('./admissions/tracker/public-tracker.component').then(m => m.PublicTrackerComponent)
          }
        ]
      }
    ]
  }
];
