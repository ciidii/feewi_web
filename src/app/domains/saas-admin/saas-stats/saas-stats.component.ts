import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Activity, BarChart3, Building2, LucideAngularModule, TrendingUp, Users} from 'lucide-angular';
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

  totalSchools = signal<number | null>(null);
  isLoading = signal(false);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    // Seule métrique réellement disponible côté backend aujourd'hui : le nombre total
    // d'établissements (totalElements de GET /schools). Le reste (élèves, taux d'activité,
    // MRR) nécessite un endpoint d'agrégation cross-tenant (roadmap BL-SAAS-03).
    this.schoolService.getSchools('', 0, 1).subscribe({
      next: (page) => {
        this.totalSchools.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
