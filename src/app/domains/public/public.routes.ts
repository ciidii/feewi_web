import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  // On pourra ajouter ici reset-password, tenant-switcher, etc.
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
