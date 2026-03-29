import {Routes} from '@angular/router';
import {ShellComponent} from './core/layout/shell/shell.component';
import {authGuard} from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. DOMAINE PUBLIC (Authentification & Portail Parent)
  // Ces routes sont accessibles sans connexion.
  {
    path: '',
    loadChildren: () => import('./domains/public/public.routes').then(m => m.PUBLIC_ROUTES)
  },

  // 2. ADMINISTRATION SAAS (Super Admin uniquement)
  {
    path: 'saas',
    component: ShellComponent,
    canActivate: [authGuard],
    data: {roles: ['ROLE_SUPER_ADMIN']},
    loadChildren: () => import('./domains/saas-admin/saas-admin.routes').then(m => m.SAAS_ADMIN_ROUTES)
  },

  // 3. ADMINISTRATION ÉCOLE (Secrétariat, Direction, etc.)
  // On utilise un préfixe 'admin' pour isoler totalement ces routes du monde public.
  {
    path: 'admin',
    component: ShellComponent,
    canActivate: [authGuard],
    data: {roles: ['ROLE_ADMIN', 'ROLE_SECRETARY']},
    loadChildren: () => import('./domains/school-app/school-app.routes').then(m => m.SCHOOL_APP_ROUTES)
  },

  // 4. GESTION DES ERREURS
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
