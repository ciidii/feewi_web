import {Component, inject, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  ArrowLeftRight,
  BarChart3,
  Briefcase,
  Building2,
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
import {TranslateModule} from '@ngx-translate/core';
import {MatMenuModule} from '@angular/material/menu';

@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, TranslateModule, MatMenuModule],
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

  // Ic├┤nes
  readonly Home = Home;
  readonly Settings = Settings;
  readonly User = Users;
  readonly LogOut = LogOut;
  readonly Briefcase = Briefcase;
  readonly GraduationCap = GraduationCap;
  readonly LayoutGrid = LayoutGrid;
  readonly ShieldCheck = ShieldCheck;
  readonly ArrowLeftRight = ArrowLeftRight;
  readonly BarChart3 = BarChart3;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Monitor = Monitor;
  readonly Maximize = Maximize;
  readonly Minimize = Minimize;
  protected readonly Shield = Shield;
  protected readonly Building2 = Building2;
  protected readonly School = School;
  protected readonly Users = Users;

  // Nouvelles icônes pour le toggle
  readonly PanelLeftClose = PanelLeftClose;
  readonly PanelLeftOpen = PanelLeftOpen;

  constructor() {
    // Charger l'├®tat sauvegard├® au d├®marrage
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

    // Auto-collapse si le rail était étendu
    if (this.navService.isRailExpanded()) {
      this.toggleRailExpanded();
    }
  }

  openProfileDialog() {
    console.log('Open profile from Rail');
  }
}
