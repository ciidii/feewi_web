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
        path: 're-enrollment',
        title: 'Réinscription Administrative',
        loadComponent: () => import('./features/admissions/re-enrollment/re-enrollment.component').then(m => m.SecretaryReEnrollmentComponent)
      },
      {
        path: 'settings',
        title: 'Configuration Portail',
        loadComponent: () => import('./features/admissions/admission-config/admission-config.component').then(m => m.AdmissionConfigComponent)
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
    children: [
      {
        path: '',
        title: 'Structure Éducative',
        loadComponent: () => import('./features/academic/structure-config/structure-config.component').then(m => m.StructureConfigComponent)
      },
      {
        path: 'cycles/:id',
        title: 'Détails du Cycle',
        loadComponent: () => import('./features/academic/structure-config/cycle-detail/cycle-detail.component').then(m => m.CycleDetailComponent)
      }
    ]
  },
  {
    path: 'academic',
    children: [
      {
        path: 'library',
        title: 'Bibliothèque des Matières',
        loadComponent: () => import('./features/academic/subject-library/subject-library.component').then(m => m.SubjectLibraryComponent)
      },
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
