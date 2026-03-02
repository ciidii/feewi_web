import { Routes } from '@angular/router';

export const SCHOOL_APP_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'admissions',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admissions/admission-list/admission-list.component').then(m => m.AdmissionsComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/admissions/admission-detail/admission-detail.component').then(m => m.AdmissionDetailComponent)
      }
    ]
  },
  {
    path: 'identity',
    children: [
      {
        path: 'staff',
        loadComponent: () => import('./features/identity/staff-directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/identity/role-designer/role-designer.component').then(m => m.RoleDesignerComponent)
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/identity/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent)
      }
    ]
  },
  {
    path: 'classes',
    loadComponent: () => import('./features/academic/structure-config/structure-config.component').then(m => m.StructureConfigComponent)
  },
  {
    path: 'academic',
    children: [
      {
        path: 'years',
        loadComponent: () => import('./features/academic/year-list/year-list.component').then(m => m.YearListComponent)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
