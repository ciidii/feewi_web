import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'admissions',
        loadComponent: () => import('./features/admissions/admissions.component').then(m => m.AdmissionsComponent)
      },
      {
        path: 'admissions/:id',
        loadComponent: () => import('./features/admissions/admission-detail.component').then(m => m.AdmissionDetailComponent)
      }
    ]
  }
];
