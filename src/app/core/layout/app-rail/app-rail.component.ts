import {Component, inject, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  Home,
  LayoutGrid,
  LogOut,
  LucideAngularModule,
  Maximize,
  Minimize,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  Users
} from 'lucide-angular';
import {AuthService} from '../../services/auth.service';
import {NavigationContextService} from '../../services/navigation-context.service';
import {NavigationStateService} from '../../services/navigation-state.service';
import {TenantContextService} from '../../services/tenant-context.service';
import {UiPreferenceService} from '../../../shared/services/ui-preference.service';
import {InAppNotificationService} from '../../services/in-app-notification.service';
import {TranslateModule} from '@ngx-translate/core';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {HasPermissionDirective} from '../../../shared/directives/has-permission.directive';
import {NotificationPopoverComponent} from '../../../shared/components/notification-popover/notification-popover.component';
import {ProfileDialogComponent} from './components/profile-dialog/profile-dialog.component';

@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    TranslateModule,
    MatMenuModule,
    MatDialogModule,
    HasPermissionDirective,
    NotificationPopoverComponent
  ],
  templateUrl: './app-rail.component.html',
  styleUrl: './app-rail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppRailComponent {
  auth = inject(AuthService);
  tenantService = inject(TenantContextService);
  contextService = inject(NavigationContextService);
  navService = inject(NavigationStateService);
  uiService = inject(UiPreferenceService);
  notificationService = inject(InAppNotificationService);
  private dialog = inject(MatDialog);

  unreadCount = this.notificationService.unreadCount;

  // Icônes
  readonly Home = Home;
  readonly Settings = Settings;
  readonly User = Users;
  readonly LogOut = LogOut;
  readonly Bell = Bell;
  readonly Briefcase = Briefcase;
  readonly FileText = FileText;
  readonly GraduationCap = GraduationCap;
  readonly LayoutGrid = LayoutGrid;
  readonly ShieldCheck = ShieldCheck;
  protected readonly Shield = Shield;
  protected readonly Building2 = Building2;
  protected readonly School = School;
  protected readonly Users = Users;

  // Nouvelles icônes pour le toggle
  readonly PanelLeftClose = PanelLeftClose;
  readonly PanelLeftOpen = PanelLeftOpen;

  get initials(): string {
    const user = this.auth.currentUser();
    if (!user) return '--';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  }

  constructor() {
    // Charger l'état sauvegardé au démarrage
    const saved = localStorage.getItem('fewii-rail-expanded');
    if (saved !== null) {
      this.navService.setRailExpanded(saved === 'true');
    }
  }

  isRailExpanded(): boolean {
    return this.navService.isRailExpanded();
  }

  toggleRailExpanded(): void {
    this.navService.toggleRail();
    localStorage.setItem('fewii-rail-expanded', String(this.navService.isRailExpanded()));
  }

  // Méthode existante
  onSelectService(serviceName: string) {
    this.navService.setActiveService(serviceName);
  }

  openProfileDialog() {
    this.dialog.open(ProfileDialogComponent, {width: '400px', panelClass: 'feewi-dialog-panel'});
  }
}
