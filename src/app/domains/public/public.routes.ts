import { Routes } from '@angular/router';
import { PublicEnrollmentLayoutComponent } from './enrollment/layout/public-enrollment-layout.component';

export const PUBLIC_ROUTES: Routes = [
  // 1. Flux Authentification (Login, etc.)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
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
        path: 'tracker/:id',
        loadComponent: () => import('./enrollment/tracker/public-tracker.component').then(m => m.PublicTrackerComponent)
      },
      {
        path: 'soft-enrollment',
        loadComponent: () => import('./enrollment/soft-enrollment/public-soft-enrollment.component').then(m => m.SoftEnrollmentComponent)
      }
    ]
  }
];
