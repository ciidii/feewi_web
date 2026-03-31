import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  LayoutDashboard,
  Filter,
  RefreshCw
} from 'lucide-angular';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AdmissionApplication, AdmissionStatus } from '../../../../../core/models/enrollment.model';
import { Level } from '../../../../../core/models/academic.model';
import { forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-admission-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './admission-dashboard.component.html',
  styleUrls: ['./admission-dashboard.component.scss']
})
export class AdmissionDashboardComponent implements OnInit {
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);

  // --- ÉTATS ---
  applications = signal<AdmissionApplication[]>([]);
  levels = signal<Level[]>([]);
  isLoading = signal(true);

  // --- CALCULS STATISTIQUES ---

  totalApps = computed(() => this.applications().length);

  newAppsCount = computed(() => this.applications().filter(a => a.type === 'NEW').length);
  reEnrollCount = computed(() => this.applications().filter(a => a.type === 'RE_ENROLL').length);

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
      const count = apps.filter(a => a.levelId === lvl.id).length;
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
      apps: this.enrollmentService.getApplications(),
      levels: this.academicService.getLevels()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ apps, levels }) => {
        this.applications.set(apps);
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
