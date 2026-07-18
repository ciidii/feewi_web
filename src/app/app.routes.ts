import {Routes} from '@angular/router';
import {ShellComponent} from './core/layout/shell/shell.component';
import {authGuard} from './core/guards/auth.guard';
import {ParentShellComponent} from './domains/parent-portal/parent-shell/parent-shell.component';

export const routes: Routes = [
  // 1. DOMAINE PUBLIC (Authentification & Portail vitrine/admissions)
  // Ces routes sont accessibles sans connexion.
  {
    path: '',
    loadChildren: () => import('./domains/public/public.routes').then(m => m.PUBLIC_ROUTES)
  },

  // 1bis. PORTAIL PARENT (authentifié, rôle ROLE_PARENT uniquement)
  {
    path: 'parent',
    component: ParentShellComponent,
    canActivate: [authGuard],
    data: {roles: ['ROLE_PARENT']},
    loadChildren: () => import('./domains/parent-portal/parent-portal.routes').then(m => m.PARENT_PORTAL_ROUTES)
  },

  // 2. ADMINISTRATION SAAS (Super Admin uniquement)
  {
    path: 'saas',
    component: ShellComponent,
    canActivate: [authGuard],
    // Garde-fou réservé au super-admin : identity:saas:school:list est une permission
    // système absente des rôles d'école (identity:school:read, elle, est portée par tout admin d'école).
    data: {permissions: ['identity:saas:school:list']},
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
  {
    path: '500',
    loadComponent: () => import('./domains/public/errors/server-error/server-error.component').then(m => m.ServerErrorComponent)
  },
  {path: '**', redirectTo: '404'}
];
