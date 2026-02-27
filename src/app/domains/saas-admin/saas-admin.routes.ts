import { Routes } from '@angular/router';

export const SAAS_ADMIN_ROUTES: Routes = [
  {
    path: 'tenants',
    loadComponent: () => import('./tenant-manager/tenant-manager.component').then(m => m.TenantManagerComponent)
  },
  {
    path: '',
    redirectTo: 'tenants',
    pathMatch: 'full'
  }
];
