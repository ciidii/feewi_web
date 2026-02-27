import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell/shell.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. MONDE PUBLIC (Pas de Shell)
  {
    path: 'auth',
    loadChildren: () => import('./domains/public/public.routes').then(m => m.PUBLIC_ROUTES)
  },

  // 2. MONDE SAAS ADMIN (Dans le Shell, uniquement pour ROLE_SUPER_ADMIN)
  {
    path: 'saas',
    component: ShellComponent,
    canActivate: [authGuard],
    loadChildren: () => import('./domains/saas-admin/saas-admin.routes').then(m => m.SAAS_ADMIN_ROUTES)
  },

  // 3. MONDE ÉCOLE (Dans le Shell, métier quotidien)
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    loadChildren: () => import('./domains/school-app/school-app.routes').then(m => m.SCHOOL_APP_ROUTES)
  },

  // 4. Fallback
  { path: '**', redirectTo: 'auth/login' }
];
