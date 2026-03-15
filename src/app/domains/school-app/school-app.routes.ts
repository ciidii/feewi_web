import { Routes } from '@angular/router';

export const SCHOOL_APP_ROUTES: Routes = [
  {
    path: 'dashboard',
    title: 'Tableau de bord',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'admissions',
    children: [
      {
        path: '',
        title: 'Liste des Admissions',
        loadComponent: () => import('./features/admissions/admission-list/admission-list.component').then(m => m.AdmissionsComponent)
      },
      {
        path: ':id',
        title: 'Dossier d’Admission',
        loadComponent: () => import('./features/admissions/admission-detail/admission-detail.component').then(m => m.AdmissionDetailComponent)
      }
    ]
  },
  {
    path: 'identity',
    children: [
      {
        path: 'staff',
        title: 'Répertoire du Personnel',
        loadComponent: () => import('./features/identity/staff-directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
      },
      {
        path: 'roles',
        title: 'Gestion des Rôles',
        loadComponent: () => import('./features/identity/role-designer/role-designer.component').then(m => m.RoleDesignerComponent)
      },
      {
        path: 'audit',
        title: 'Piste d’Audit',
        loadComponent: () => import('./features/identity/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent)
      }
    ]
  },
  {
    path: 'classes',
    title: 'Configuration de la Structure',
    loadComponent: () => import('./features/academic/structure-config/structure-config.component').then(m => m.StructureConfigComponent)
  },
  {
    path: 'academic',
    children: [
      {
        path: 'years',
        title: 'Années Académiques',
        loadComponent: () => import('./features/academic/year-list/year-list.component').then(m => m.YearListComponent)
      },
      {
        path: 'years/:id',
        title: 'Détails de l’Année',
        loadComponent: () => import('./features/academic/year-detail/year-detail.component').then(m => m.YearDetailComponent)
      },
      {
        path: 'classes',
        title: 'Liste des Classes',
        loadComponent: () => import('./features/academic/class-list/class-list.component').then(m => m.ClassListComponent)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
