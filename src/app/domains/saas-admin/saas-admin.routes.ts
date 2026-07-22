import {Routes} from '@angular/router';

export const SAAS_ADMIN_ROUTES: Routes = [
  {
    path: 'tenants',
    title: 'Gestion des Établissements',
    loadComponent: () => import('./tenant-manager/tenant-manager.component').then(m => m.TenantManagerComponent)
  },
  {
    path: 'tenants/new',
    title: 'Nouvel Établissement',
    loadComponent: () => import('./tenant-form/tenant-form.component').then(m => m.TenantFormComponent)
  },
  {
    path: 'tenants/:id',
    title: 'Détails de l’Établissement',
    loadComponent: () => import('./tenant-detail/tenant-detail.component').then(m => m.TenantDetailComponent)
  },
  {
    path: 'stats',
    title: 'Statistiques Globales',
    loadComponent: () => import('./saas-stats/saas-stats.component').then(m => m.SaasStatsComponent)
  },
  {
    path: 'billing',
    title: 'Facturation SaaS',
    data: {permissions: ['identity:saas:school:manage']},
    loadComponent: () => import('./saas-billing/saas-billing.component').then(m => m.SaasBillingComponent)
  },
  {
    path: 'audit',
    title: 'Audit Système',
    data: {permissions: ['identity:audit:read']},
    loadComponent: () => import('./global-audit/global-audit.component').then(m => m.GlobalAuditComponent)
  },
  {
    path: '',
    redirectTo: 'tenants',
    pathMatch: 'full'
  }
];
