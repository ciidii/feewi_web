import {Component, inject, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {NavigationStateService} from '../../services/navigation-state.service';
import {AuthService} from '../../services/auth.service';
import {MatMenuModule} from '@angular/material/menu';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Globe,
  History,
  Layers,
  LayoutGrid,
  LucideAngularModule,
  Maximize,
  Minimize,
  Moon,
  Plus, Shield,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wallet
} from 'lucide-angular';

import {UiPreferenceService} from '../../../shared/services/ui-preference.service';
import {HasPermissionDirective} from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatMenuModule, LucideAngularModule, RouterModule, HasPermissionDirective],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent {
  navService = inject(NavigationStateService);
  auth = inject(AuthService);
  uiService = inject(UiPreferenceService);

  // Icônes pour le template
  readonly Plus = Plus;
  readonly UserPlus = UserPlus;
  readonly UserCheck = UserCheck;
  readonly ChevronDown = ChevronDown;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ShieldCheck = ShieldCheck;
  readonly BarChart3 = BarChart3;
  readonly Users = Users;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Maximize = Maximize;
  readonly Minimize = Minimize;

  // --- 1. ENROLLMENT SERVICE ---
  enrollmentItems = [
    { label: 'Tableau de bord', icon: BarChart3, route: '/admin/enrollment', permission: 'enrollment:dashboard:view' },
    { label: 'Liste des dossiers', icon: Briefcase, route: '/admin/enrollment/list', permission: 'enrollment:admission:view' },
    { label: 'Réinscription', icon: UserPlus, route: '/admin/enrollment/re-enrollment', permission: 'enrollment:admission:submit' },
    { label: 'Paramètres Portail', icon: Globe, route: '/admin/enrollment/settings', permission: 'enrollment:config:manage' },
  ];

  // --- 2. STUDENT REGISTRY ---
  registryItems = [
    { label: 'Liste des élèves', icon: Users, route: '/admin/registry/students', queryParams: null, permission: 'academic:assignment:read' },
    { label: 'Dossiers scolaires', icon: FileText, route: '/admin/registry/students', queryParams: { status: 'LEFT' }, permission: 'academic:assignment:read' },
  ];

  // --- 3. ACADEMIC STRUCTURE ---
  academicItems = [
    { label: 'Structure & Classes', icon: Layers, route: '/admin/classes', permission: 'academic:structure:read' },
    { label: 'Affectations Élèves', icon: UserCheck, route: '/admin/academic/assignments', permission: 'academic:assignment:read' },
    { label: 'Bibliothèque Matières', icon: BookOpen, route: '/admin/academic/library', permission: 'academic:structure:read' },
    { label: 'Calendrier Scolaire', icon: Calendar, route: '/admin/academic/years', permission: 'academic:year:read' },
  ];

  // --- 3b. DOCUMENT REQUESTS ---
  documentItems = [
    { label: 'Demandes de documents', icon: FileText, route: '/admin/documents/requests', permission: 'document:request:manage' },
  ];

  // --- 3c. FINANCE ---
  financeItems = [
    { label: 'Catalogue des frais', icon: Wallet, route: '/admin/finance/fee-types', permission: 'finance:fee:manage' },
    { label: 'Suivi des paiements', icon: ClipboardCheck, route: '/admin/finance/payment-tracking', permission: 'finance:payment:read' },
  ];

  // --- 4. IDENTITY SERVICE ---
  identityItems = [
    { label: 'Personnel (Staff)', icon: Users, route: '/admin/identity/staff', permission: 'identity:user:read' },
    { label: 'Comptes d’Accès', icon: Shield, route: '/admin/identity/accounts', permission: 'identity:user:read' },
    { label: 'Rôles & Droits', icon: ShieldCheck, route: '/admin/identity/roles', permission: 'identity:role:read' },
    { label: 'Journal d\'audit', icon: History, route: '/admin/identity/audit', permission: 'identity:audit:read' },
  ];

  // --- CONFIGURATION SAAS ADMIN ---
  saasItems = [
    { label: 'Établissements', icon: Building2, route: '/saas/tenants', permission: 'identity:saas:school:list' },
    { label: 'Statistiques Globales', icon: BarChart3, route: '/saas/stats', permission: 'identity:saas:school:list' },
    { label: 'Audit Système', icon: FileText, route: '/saas/audit', permission: 'identity:audit:read' },
  ];

  schoolSettingsItems = [
    { label: 'Mon Établissement', icon: Building2, route: '/admin/settings/school', permission: 'identity:school:read' },
  ];

  getActiveServiceLabel(): string {
    const service = this.navService.activeService();
    switch (service) {
      case 'dashboard': return 'Tableau de bord';
      case 'enrollment': return 'Inscriptions';
      case 'registry': return 'Registre élèves';
      case 'documents': return 'Demandes de documents';
      case 'finance': return 'Finance';
      case 'academic': return 'Structure Acad.';
      case 'identity': return 'Sécurité & Staff';
      case 'saas': return 'Système SaaS';
      case 'settings': return 'Réglages';
      default: return 'Administration';
    }
  }

  protected readonly User = User;
  protected readonly LayoutGrid = LayoutGrid;
}
