import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Activity,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LucideAngularModule,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-angular';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {Admission} from '../../../../../core/models/enrollment.model';
import {Level} from '../../../../../core/models/academic.model';
import {finalize, forkJoin} from 'rxjs';

import { FwPageShellComponent } from '../../../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-admission-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwPageShellComponent],
  templateUrl: './admission-dashboard.component.html',
  styleUrls: ['./admission-dashboard.component.scss']
})
export class AdmissionDashboardComponent implements OnInit {
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);

  // --- ÉTATS ---
  applications = signal<Admission[]>([]);
  levels = signal<Level[]>([]);
  isLoading = signal(true);

  // --- CALCULS STATISTIQUES ---

  totalApps = computed(() => this.applications().length);

  newAppsCount = computed(() => this.applications().filter(a => a.type === 'NEW_ENROLLMENT').length);
  reEnrollCount = computed(() => this.applications().filter(a => a.type === 'RE_ENROLLMENT').length);

  statusStats = computed(() => {
    const apps = this.applications();
    return {
      submitted: apps.filter(a => a.status === 'SUBMITTED').length,
      verified: apps.filter(a => a.status === 'VERIFIED').length,
      testing: apps.filter(a => a.status === 'TESTING' || a.status === 'WAITLIST').length,
      validated: apps.filter(a => a.status === 'VALIDATED').length,
      rejected: apps.filter(a => a.status === 'REJECTED' || a.status === 'CANCELLED').length
    };
  });

  conversionRate = computed(() => {
    if (this.totalApps() === 0) return 0;
    return Math.round((this.statusStats().validated / this.totalApps()) * 100);
  });

  appsByLevel = computed(() => {
    const apps = this.applications();
    return this.levels().map(lvl => {
      const count = apps.filter(a => a.schooling?.levelId === lvl.id).length;
      const percentage = this.totalApps() > 0 ? (count / this.totalApps()) * 100 : 0;
      return {
        name: lvl.name,
        count,
        percentage
      };
    }).sort((a, b) => b.count - a.count).slice(0, 6); // Top 6 niveaux
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    forkJoin({
      // On demande une taille large pour le dashboard afin d'avoir les stats globales
      // Idéalement, il faudrait un endpoint /stats dédié.
      apps: this.enrollmentService.getApplications({ size: 1000 }),
      levels: this.academicService.getLevels()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({apps, levels}) => {
        this.applications.set(apps.content || []);
        this.levels.set(levels);
      }
    });
  }

  // Icônes
  readonly Users = Users;
  readonly GraduationCap = GraduationCap;
  readonly TrendingUp = TrendingUp;
  readonly Activity = Activity;
  readonly Clock = Clock;
  readonly ShieldCheck = ShieldCheck;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly FileText = FileText;
  readonly LayoutDashboard = LayoutDashboard;
  readonly Filter = Filter;
  protected readonly RefreshCw = RefreshCw;
  protected readonly Math = Math;
}
