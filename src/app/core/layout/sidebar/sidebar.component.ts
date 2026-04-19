import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationStateService } from '../../services/navigation-state.service';
import { AuthService } from '../../services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Calendar,
  BookOpen,
  FileText,
  Briefcase,
  ShieldCheck,
  Building2,
  Globe,
  BarChart3,
  History,
  Layers,
  UserPlus,
  UserCheck,
  ChevronDown
} from 'lucide-angular';

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

  // --- 1. ENROLLMENT SERVICE ---
  enrollmentItems = [
    { label: 'Tableau de bord', icon: BarChart3, route: '/admin/admissions' },
    { label: 'Liste des dossiers', icon: Briefcase, route: '/admin/admissions/list' },
    { label: 'Réinscription', icon: UserPlus, route: '/admin/admissions/re-enrollment' },
    { label: 'Paramètres Portail', icon: Globe, route: '/admin/admissions/settings' },
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
}
