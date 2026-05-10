import {Component, inject, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  Activity,
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  LayoutDashboard,
  LucideAngularModule,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserPlus,
  Users
} from 'lucide-angular';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {AuthService} from '../../../../../core/services/auth.service';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    FwButtonComponent,
    FwBadgeComponent,
    FwPageShellComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;

  // Icônes
  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly Settings = Settings;
  readonly UserPlus = UserPlus;
  readonly ShieldCheck = ShieldCheck;
  readonly FileText = FileText;
  readonly ArrowRight = ArrowRight;
  readonly Star = Star;
  readonly Clock = Clock;
  readonly Search = Search;
  readonly Activity = Activity;
  readonly ChevronRight = ChevronRight;
  readonly PlusCircle = PlusCircle;

  favorites = [
    { label: 'Admissions', icon: Activity, path: '/admin/admissions/list' },
    { label: 'Répertoire', icon: Users, path: '/admin/registry/students' },
    { label: 'Années', icon: Calendar, path: '/admin/academic/years' },
    { label: 'Configuration', icon: Settings, path: '/admin/admissions/settings' }
  ];

  quickActions = [
    { label: 'Inscrire un élève', icon: UserPlus, path: '/admin/admissions/direct', description: 'Saisie guichet directe' },
    { label: 'Modifier les rôles', icon: ShieldCheck, path: '/admin/identity/roles', description: 'Gérer les accès staff' },
    { label: 'Structure classes', icon: LayoutDashboard, path: '/admin/classes', description: 'Cycles et niveaux' },
    { label: 'Extraire Rapports', icon: FileText, path: '/admin/identity/audit', description: 'Piste d\'audit & logs' }
  ];

  lastActions = [
    { label: 'Validation dossier #ADM-2024-001', time: 'Il y a 10 min', user: 'Admin', status: 'ADMITTED' },
    { label: 'Modification calendrier scolaire', time: 'Il y a 2 heures', user: 'Secrétariat', status: 'PLANNING' },
    { label: 'Suspension élève : KOFFI Kouassi', time: 'Hier', user: 'Direction', status: 'SUSPENDED' }
  ];

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  protected readonly PlusCircle = PlusCircle;
}
