import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  LucideAngularModule,
  TrendingUp,
  Users
} from 'lucide-angular';
import {SchoolService} from '../../../core/services/school.service';
import {FwPageShellComponent} from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-saas-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwPageShellComponent],
  templateUrl: './saas-stats.component.html'
})
export class SaasStatsComponent implements OnInit {
  private schoolService = inject(SchoolService);

  readonly BarChart3 = BarChart3;
  readonly Building2 = Building2;
  readonly Users = Users;
  readonly Activity = Activity;
  readonly TrendingUp = TrendingUp;
  readonly ArrowUpRight = ArrowUpRight;
  readonly ArrowDownRight = ArrowDownRight;

  stats = signal({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    systemUptime: '99.9%'
  });

  isLoading = signal(false);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    // Simulate API call for global stats
    setTimeout(() => {
      this.stats.set({
        totalSchools: this.schoolService.schoolsPage()?.totalElements || 0,
        activeSchools: 12, // Mock data
        totalStudents: 4500, // Mock data
        systemUptime: '99.98%'
      });
      this.isLoading.set(false);
    }, 800);
  }
}
