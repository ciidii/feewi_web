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
  FileText,
  Globe,
  History,
  Layers,
  LayoutGrid,
  LogOut,
  LucideAngularModule,
  Maximize,
  Minimize,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-angular';

import {UiPreferenceService} from '../../../shared/services/ui-preference.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatMenuModule, LucideAngularModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent {
  navService = inject(NavigationStateService);
  auth = inject(AuthService);
  uiService = inject(UiPreferenceService);

  // Ic├┤nes pour le template
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
  readonly Globe = Globe;

  // --- 1. ENROLLMENT SERVICE ---
  enrollmentItems = [
    { label: 'Tableau de bord', icon: BarChart3, route: '/admin/enrollment' },
    { label: 'Liste des dossiers', icon: Briefcase, route: '/admin/enrollment/list' },
    { label: 'Réinscription', icon: UserPlus, route: '/admin/enrollment/re-enrollment' },
    { label: 'Paramètres Portail', icon: Globe, route: '/admin/enrollment/settings' },
  ];

  // --- 2. STUDENT REGISTRY ---
  registryItems = [
    { label: 'Liste des élèves', icon: Users, route: '/admin/registry/students' },
    { label: 'Dossiers scolaires', icon: FileText, route: '/admin/registry/students/records' },
  ];

  // --- 3. ACADEMIC STRUCTURE ---
  academicItems = [
    { label: 'Architecture & Cycles', icon: Layers, route: '/admin/classes' },
    { label: 'Gestion des Classes', icon: Users, route: '/admin/academic/classes' },
    { label: 'Bibliothèque Matières', icon: BookOpen, route: '/admin/academic/library' },
    { label: 'Calendrier Scolaire', icon: Calendar, route: '/admin/academic/years' },
  ];

  // --- 4. IDENTITY SERVICE ---
  identityItems = [
    { label: 'Personnel (Staff)', icon: Users, route: '/admin/identity/staff' },
    { label: 'Rôles & Droits', icon: ShieldCheck, route: '/admin/identity/roles' },
    { label: 'Journal d\'audit', icon: History, route: '/admin/identity/audit' },
  ];

  // --- CONFIGURATION SAAS ADMIN ---
  saasItems = [
    { label: 'Établissements', icon: Building2, route: '/saas/tenants' },
    { label: 'Statistiques Globales', icon: BarChart3, route: '/saas/stats' },
    { label: 'Audit Système', icon: FileText, route: '/saas/audit' },
  ];

  getActiveServiceLabel(): string {
    const service = this.navService.activeService();
    switch (service) {
      case 'dashboard': return 'Tableau de bord';
      case 'enrollment': return 'Inscriptions';
      case 'registry': return 'Registre élèves';
      case 'academic': return 'Structure Acad.';
      case 'identity': return 'Sécurité & Staff';
      case 'saas': return 'Système SaaS';
      case 'settings': return 'Réglages';
      default: return 'Administration';
    }
  }

  protected readonly User = User;
  protected readonly LogOut = LogOut;
  protected readonly LayoutGrid = LayoutGrid;
}
