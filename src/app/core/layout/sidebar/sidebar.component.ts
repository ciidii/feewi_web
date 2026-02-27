import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationStateService } from '../../services/navigation-state.service';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, ChevronLeft, ChevronRight, Plus, Users, School, Calendar, BookOpen, FileText, Briefcase, ShieldCheck, Building2, Globe, BarChart3 } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, LucideAngularModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navService = inject(NavigationStateService);
  auth = inject(AuthService);

  readonly Plus = Plus;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ShieldCheck = ShieldCheck;

  // --- CONFIGURATION ÉCOLE ---
  academicItems = [
    { label: 'Admissions', icon: Briefcase, route: '/admissions' },
    { label: 'Classes', icon: School, route: '/classes' },
    { label: 'Élèves', icon: Users, route: '/students' },
  ];

  identityItems = [
    { label: 'Personnel', icon: Users, route: '/identity/staff' },
    { label: 'Rôles & Droits', icon: ShieldCheck, route: '/identity/roles' },
    { label: 'Journal d\'audit', icon: FileText, route: '/identity/audit' },
  ];

  // --- CONFIGURATION SAAS ADMIN ---
  saasItems = [
    { label: 'Établissements', icon: Building2, route: '/saas/tenants' },
    { label: 'Sous-domaines', icon: Globe, route: '/saas/domains' },
    { label: 'Statistiques Globales', icon: BarChart3, route: '/saas/stats' },
    { label: 'Audit Système', icon: FileText, route: '/saas/audit' },
  ];
}
