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
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
