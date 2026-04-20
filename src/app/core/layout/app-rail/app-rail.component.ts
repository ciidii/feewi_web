import { Component, inject, ViewEncapsulation, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule, Home, Settings, Briefcase, GraduationCap, LayoutGrid, ShieldCheck, ArrowLeftRight, BarChart3,
  Shield, Building2, School, Users, PanelLeftClose, PanelLeftOpen
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { NavigationContextService } from '../../services/navigation-context.service';
import { NavigationStateService } from '../../services/navigation-state.service';
import { TenantContextService } from '../../services/tenant-context.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, TranslateModule],
  templateUrl: './app-rail.component.html',
  styleUrl: './app-rail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppRailComponent {
  auth = inject(AuthService);
  tenantService = inject(TenantContextService);
  contextService = inject(NavigationContextService);
  navService = inject(NavigationStateService);

  // Icônes existantes
  readonly Home = Home;
  readonly Settings = Settings;
  readonly Briefcase = Briefcase;
  readonly GraduationCap = GraduationCap;
  readonly LayoutGrid = LayoutGrid;
  readonly ShieldCheck = ShieldCheck;
  readonly ArrowLeftRight = ArrowLeftRight;
  readonly BarChart3 = BarChart3;
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
}
