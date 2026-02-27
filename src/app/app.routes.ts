import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell/shell.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 1. Routes d'authentification (sans le Shell)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      }
    ]
  },

  // 2. Routes protégées (dans le Shell)
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'saas/tenants',
        loadComponent: () => import('./features/admin/tenant-manager/tenant-manager.component').then(m => m.TenantManagerComponent)
      },
      {
        path: 'identity/staff',
        loadComponent: () => import('./features/admin/staff-directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
      },
      {
        path: 'identity/roles',
        loadComponent: () => import('./features/admin/role-designer/role-designer.component').then(m => m.RoleDesignerComponent)
      },
      {
        path: 'identity/audit',
        loadComponent: () => import('./features/admin/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent)
      },
      {
        path: 'admissions',
        loadComponent: () => import('./features/admissions/admission-list/admission-list.component').then(m => m.AdmissionsComponent)
      },
      {
        path: 'admissions/:id',
        loadComponent: () => import('./features/admissions/admission-detail/admission-detail.component').then(m => m.AdmissionDetailComponent)
      }
    ]
  },

  // 3. Fallback
  { path: '**', redirectTo: 'auth/login' }
];
