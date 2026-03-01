import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule, Home, Settings, Briefcase, GraduationCap, LayoutGrid, ShieldCheck, ArrowLeftRight, BarChart3,
  Shield, Building2, School, Users
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { NavigationContextService } from '../../services/navigation-context.service';
import { NavigationStateService } from '../../services/navigation-state.service';

@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './app-rail.component.html',
  styleUrl: './app-rail.component.scss'
})
export class AppRailComponent {
  auth = inject(AuthService);
  contextService = inject(NavigationContextService);
  navService = inject(NavigationStateService);

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

  onSelectService(serviceName: string) {
    this.navService.setActiveService(serviceName);
  }
}
