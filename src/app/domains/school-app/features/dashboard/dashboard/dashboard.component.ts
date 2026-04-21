import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, GraduationCap, TrendingUp, Activity, LayoutDashboard } from 'lucide-angular';
import { FwPageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { FwBadgeComponent } from '../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwPageHeaderComponent, FwBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent {
  readonly Users = Users;
  readonly GraduationCap = GraduationCap;
  readonly TrendingUp = TrendingUp;
  readonly Activity = Activity;
  readonly LayoutDashboard = LayoutDashboard;
}
