import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationStateService } from '../../services/navigation-state.service';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  School,
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
  imports: [CommonModule, MatButtonModule, MatMenuModule, LucideAngularModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navService = inject(NavigationStateService);
  auth = inject(AuthService);

  readonly Plus = Plus;
  readonly UserPlus = UserPlus;
  readonly UserCheck = UserCheck;
  readonly ChevronDown = ChevronDown;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ShieldCheck = ShieldCheck;
  readonly History = History;

  // --- 1. ENROLLMENT SERVICE (Opérationnel) ---
  enrollmentItems = [
    { label: 'Admissions', icon: Briefcase, route: '/admin/admissions' },
    { label: 'Paramètres Portail', icon: Globe, route: '/admin/admissions/settings' },
  ];

  // --- 2. STUDENT REGISTRY (Référentiel) ---
  registryItems = [
    { label: 'Liste des élèves', icon: Users, route: '/admin/students' },
    { label: 'Dossiers scolaires', icon: FileText, route: '/admin/students/records' },
  ];

  // --- 3. ACADEMIC STRUCTURE (Référentiel & Pilotage) ---
  academicItems = [
    { label: 'Architecture & Cycles', icon: Layers, route: '/admin/classes' },
    { label: 'Gestion des Classes', icon: Users, route: '/admin/academic/classes' },
    { label: 'Bibliothèque Matières', icon: BookOpen, route: '/admin/academic/library' },
    { label: 'Calendrier Scolaire', icon: Calendar, route: '/admin/academic/years' },
  ];

  // --- 4. IDENTITY SERVICE (Fondation) ---
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
  protected readonly BarChart3 = BarChart3;
}
