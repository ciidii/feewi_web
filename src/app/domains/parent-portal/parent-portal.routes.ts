import {Routes} from '@angular/router';

export const PARENT_PORTAL_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent)
  },
  {
    path: 'child/:id',
    loadComponent: () => import('./child-detail/parent-child-detail.component').then(m => m.ParentChildDetailComponent)
  },
  {path: '', redirectTo: 'dashboard', pathMatch: 'full'}
];
