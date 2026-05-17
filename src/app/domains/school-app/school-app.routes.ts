import {Routes} from '@angular/router';

export const SCHOOL_APP_ROUTES: Routes = [
  {
    path: 'home',
    title: 'Console de Pilotage',
    loadComponent: () => import('./features/dashboard/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    title: 'Tableau de bord',
    loadComponent: () => import('./features/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'enrollment',
    children: [
      {
        path: '',
        title: 'Tableau de Bord Admissions',
        loadComponent: () => import('./features/enrollment/enrollment-dashboard/admission-dashboard.component').then(m => m.AdmissionDashboardComponent)
      },
      {
        path: 'list',
        title: 'Liste des Admissions',
        loadComponent: () => import('./features/enrollment/enrollment-list/admission-list.component').then(m => m.AdmissionsComponent)
      },
      {
        path: 'direct',
        title: 'Saisie Guichet',
        loadComponent: () => import('./features/enrollment/enrollment-direct-entry/admission-direct-entry.component').then(m => m.AdmissionDirectEntryComponent)
      },
      {
        path: 're-enrollment',
        title: 'Réinscription Administrative',
        loadComponent: () => import('./features/enrollment/re-enrollment/re-enrollment.component').then(m => m.SecretaryReEnrollmentComponent)
      },
      {
        path: 'settings',
        title: 'Configuration Portail',
        loadComponent: () => import('./features/enrollment/enrollment-config/enrollment-config.component').then(m => m.EnrollmentConfigComponent)
      },
      {
        path: ':id',
        title: 'Dossier d’Admission',
        loadComponent: () => import('./features/enrollment/enrollment-detail/admission-detail.component').then(m => m.AdmissionDetailComponent)
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
      },
      {
        path: 'levels/:id/curriculum',
        title: 'Programme du Niveau',
        loadComponent: () => import('./features/academic/structure-config/curriculum-detail/curriculum-detail.component').then(m => m.CurriculumDetailComponent)
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
      },
      {
        path: 'classes/:id',
        title: 'Détail de la Classe',
        loadComponent: () => import('./features/academic/class-detail/class-detail.component').then(m => m.ClassDetailComponent)
      },
      {
        path: 'assignments',
        title: 'Affectations & Classes',
        loadComponent: () => import('./features/academic/student-assignment/student-assignment.component').then(m => m.StudentAssignmentComponent)
      }
    ]
  },
  {
    path: 'registry',
    children: [
      {
        path: 'students',
        title: 'Répertoire des Élèves',
        loadComponent: () => import('./features/registry/student-list/student-list.component').then(m => m.StudentListComponent)
      },
      {
        path: 'students/:id',
        title: 'Dossier Élève',
        loadComponent: () => import('./features/registry/student-detail/student-detail.component').then(m => m.StudentDetailComponent)
      },
      {
        path: 'students/:id/edit',
        title: 'Modifier Élève',
        loadComponent: () => import('./features/registry/student-edit-form/student-edit-form.component').then(m => m.StudentEditFormComponent)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];
