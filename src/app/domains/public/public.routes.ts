import { Routes } from '@angular/router';
import { publicGuard } from '../../core/guards/public.guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent)
  },
  // --- Pages d'erreurs (Accessibles à tous) ---
  {
    path: '404',
    loadComponent: () => import('./errors/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '403',
    loadComponent: () => import('./errors/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: '500',
    loadComponent: () => import('./errors/server-error/server-error.component').then(m => m.ServerErrorComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
