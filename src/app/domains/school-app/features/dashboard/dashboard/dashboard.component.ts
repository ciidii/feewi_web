import {Component, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Activity,
  GraduationCap, History,
  LayoutDashboard,
  LucideAngularModule,
  Search,
  TrendingUp,
  Users
} from 'lucide-angular';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwPageShellComponent, FwBadgeComponent],
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
  readonly HistoryIcon = History;
  readonly Search = Search;
  protected readonly History = History;
}
