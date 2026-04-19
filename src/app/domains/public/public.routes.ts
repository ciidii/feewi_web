import { Routes } from '@angular/router';
import { PublicEnrollmentLayoutComponent } from './enrollment/layout/public-enrollment-layout.component';
import { AuthLayoutComponent } from './auth/layout/auth-layout.component';

export const PUBLIC_ROUTES: Routes = [
  // 1. Flux Authentification (Enveloppé dans AuthLayout)
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
      // Redirection par défaut : /auth -> /auth/login
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      // Catch-all pour le module auth : /auth/inconnu -> /auth/login
      {
        path: '**',
        redirectTo: 'login'
      }
    ]
  },

  // 2. Flux Enrollment (Portail Parent)
  {
    path: 'enrollment',
    component: PublicEnrollmentLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./enrollment/landing/public-landing.component').then(m => m.PublicLandingComponent)
      },
      {
        path: 'form-stepper',
        loadComponent: () => import('./enrollment/form-stepper/public-form-stepper.component').then(m => m.PublicFormStepperComponent)
      },
      {
        path: 'tracker',
        loadComponent: () => import('./enrollment/tracker/public-tracker.component').then(m => m.PublicTrackerComponent)
      },
      {
        path: 'tracker/:id',
        loadComponent: () => import('./enrollment/tracker/public-tracker.component').then(m => m.PublicTrackerComponent)
      },
      {
        path: 'soft-enrollment',
        loadComponent: () => import('./enrollment/soft-enrollment/public-soft-enrollment.component').then(m => m.SoftEnrollmentComponent)
      }
    ]
  },

  // 3. Redirection globale racine du module public
  {
    path: '',
    redirectTo: 'enrollment',
    pathMatch: 'full'
  }
];
