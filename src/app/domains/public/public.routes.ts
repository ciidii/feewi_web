import { Routes } from '@angular/router';
import { publicGuard } from '../../core/guards/public.guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Connexion',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    title: 'Mot de passe oublié',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    title: 'Réinitialisation du mot de passe',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent)
  },
  // --- Pages d'erreurs (Accessibles à tous) ---
  {
    path: '404',
    title: 'Page non trouvée',
    loadComponent: () => import('./errors/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '403',
    title: 'Accès refusé',
    loadComponent: () => import('./errors/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: '500',
    title: 'Erreur serveur',
    loadComponent: () => import('./errors/server-error/server-error.component').then(m => m.ServerErrorComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
