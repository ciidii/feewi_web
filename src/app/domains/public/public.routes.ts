import { Routes } from '@angular/router';
import { publicGuard } from '../../core/guards/public.guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  // On pourra ajouter ici reset-password, tenant-switcher, etc.
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
