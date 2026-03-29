import {Routes} from '@angular/router';
import {ShellComponent} from './core/layout/shell/shell.component';
import {authGuard} from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. TOUT CE QUI EST PUBLIC (Auth, Enrollment, Errors)
  {
    path: '',
    loadChildren: () => import('./domains/public/public.routes').then(m => m.PUBLIC_ROUTES)
  },

  // 2. MONDE SAAS ADMIN (Dans le Shell, uniquement pour ROLE_SUPER_ADMIN)
  {
    path: 'saas',
    component: ShellComponent,
    canActivate: [authGuard],
    data: {roles: ['ROLE_SUPER_ADMIN']},
    loadChildren: () => import('./domains/saas-admin/saas-admin.routes').then(m => m.SAAS_ADMIN_ROUTES)
  },

  // 3. MONDE ÉCOLE (Dans le Shell, métier quotidien)
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    data: {roles: ['ROLE_ADMIN', 'ROLE_SECRETARY']},
    loadChildren: () => import('./domains/school-app/school-app.routes').then(m => m.SCHOOL_APP_ROUTES)
  },

  // 4. Redirection par défaut : Racine -> Enrollment
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'enrollment'
  },

  // 5. Fallback & Erreurs
  {
    path: '403',
    loadComponent: () => import('./domains/public/errors/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  {
    path: '404',
    loadComponent: () => import('./domains/public/errors/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {path: '**', redirectTo: '404'}
];
