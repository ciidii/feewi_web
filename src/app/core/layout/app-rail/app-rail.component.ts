import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule, Home, Settings, Briefcase, GraduationCap, LayoutGrid, ShieldCheck, ArrowLeftRight, BarChart3,
  Shield, Building2
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { NavigationContextService } from '../../services/navigation-context.service';

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
}
