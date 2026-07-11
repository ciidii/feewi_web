import {Routes} from '@angular/router';

export const SCHOOL_APP_ROUTES: Routes = [
  {
    path: 'home',
    title: 'Console de Pilotage',
    loadComponent: () => import('./features/dashboard/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'account/profile',
    title: 'Mon profil',
    loadComponent: () => import('./features/account/my-profile/my-profile.component').then(m => m.MyProfileComponent)
  },
  {
    // Ancienne route maquette (valeurs codées en dur) — redirige vers le vrai tableau de bord d'admissions.
    path: 'dashboard',
    redirectTo: 'enrollment',
    pathMatch: 'full'
  },
  {
    path: 'enrollment',
    data: {
      permissions: ['enrollment:dashboard:view', 'enrollment:admission:view', 'enrollment:admission:submit', 'enrollment:admission:verify', 'enrollment:admission:assess', 'enrollment:admission:decide', 'enrollment:config:manage'],
      permissionOp: 'ANY'
    },
    children: [
      {
        path: '',
        title: 'Tableau de Bord Admissions',
        data: {permissions: ['enrollment:dashboard:view']},
        loadComponent: () => import('./features/enrollment/enrollment-dashboard/enrollment-dashboard.component').then(m => m.EnrollmentDashboardComponent)
      },
      {
        path: 'list',
        title: 'Liste des Admissions',
        loadComponent: () => import('./features/enrollment/enrollment-list/enrollment-list.component').then(m => m.EnrollmentListComponent)
      },
      {
        path: 'direct',
        title: 'Saisie Guichet',
        loadComponent: () => import('./features/enrollment/enrollment-direct-entry/enrollment-direct-entry.component').then(m => m.EnrollmentDirectEntryComponent)
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
        loadComponent: () => import('./features/enrollment/enrollment-detail/enrollment-detail.component').then(m => m.EnrollmentDetailComponent)
      }
    ]
  },
  {
    path: 'identity',
    children: [
      {
        path: 'staff',
        title: 'Répertoire du Personnel',
        data: {permissions: ['identity:user:read']},
        loadComponent: () => import('./features/identity/staff-directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
      },
      {
        path: 'staff/:id',
        title: 'Dossier Collaborateur',
        data: {permissions: ['identity:user:read']},
        loadComponent: () => import('./features/identity/staff-detail/staff-detail.component').then(m => m.StaffDetailComponent)
      },
      {
        path: 'accounts',
        title: 'Comptes d’Accès',
        data: {permissions: ['identity:user:read']},
        loadComponent: () => import('./features/identity/user-accounts/user-account-list.component').then(m => m.UserAccountListComponent)
      },
      {
        path: 'accounts/new',
        title: 'Ouvrir un Accès',
        data: {permissions: ['identity:user:write']},
        loadComponent: () => import('./features/identity/user-accounts/user-account-create/user-account-create.component').then(m => m.UserAccountCreateComponent)
      },
      {
        path: 'accounts/:id',
        title: 'Fiche de Sécurité',
        data: {permissions: ['identity:user:read']},
        loadComponent: () => import('./features/identity/user-accounts/user-detail/user-detail.component').then(m => m.UserDetailComponent)
      },
      {
        path: 'roles',
        title: 'Gestion des Rôles',
        data: {permissions: ['identity:role:read']},
        loadComponent: () => import('./features/identity/role-designer/role-designer.component').then(m => m.RoleDesignerComponent)
      },
      {
        path: 'audit',
        title: 'Piste d’Audit',
        data: {permissions: ['identity:audit:read']},
        loadComponent: () => import('./features/identity/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent)
      }
    ]
  },
  {
    path: 'classes',
    data: {permissions: ['academic:structure:read']},
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
      },
      {
        path: 'detail/:id',
        title: 'Détail de la Classe',
        loadComponent: () => import('./features/academic/class-detail/class-detail.component').then(m => m.ClassDetailComponent)
      }
    ]
  },
  {
    path: 'academic',
    children: [
      {
        path: 'library',
        title: 'Bibliothèque des Matières',
        data: {permissions: ['academic:structure:read']},
        loadComponent: () => import('./features/academic/subject-library/subject-library.component').then(m => m.SubjectLibraryComponent)
      },
      {
        path: 'years',
        title: 'Années Académiques',
        data: {permissions: ['academic:year:read']},
        loadComponent: () => import('./features/academic/year-list/year-list.component').then(m => m.YearListComponent)
      },
      {
        path: 'years/:id',
        title: 'Détails de l’Année',
        data: {permissions: ['academic:year:read']},
        loadComponent: () => import('./features/academic/year-detail/year-detail.component').then(m => m.YearDetailComponent)
      },
      {
        path: 'assignments',
        title: 'Affectations & Classes',
        data: {permissions: ['academic:assignment:read']},
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
    path: 'documents',
    data: {
      permissions: ['document:request:submit', 'document:request:manage', 'document:request:validate'],
      permissionOp: 'ANY'
    },
    children: [
      {
        path: 'requests',
        title: 'Demandes de Documents',
        loadComponent: () => import('./features/documents/document-requests/document-requests.component').then(m => m.DocumentRequestsComponent)
      }
    ]
  },
  {
    path: 'settings',
    children: [
      {
        path: 'school',
        title: 'Paramètres École',
        data: {permissions: ['identity:school:read']},
        loadComponent: () => import('./features/school-config/school-config.component').then(m => m.SchoolConfigComponent)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];
