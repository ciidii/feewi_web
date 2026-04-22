import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LucideAngularModule,
  MessageSquare,
  Plus,
  RefreshCw,
  School,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-angular';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { Admission } from '../../../../../core/models/enrollment.model';
import { AcademicYear, Level, SchoolClass } from '../../../../../core/models/academic.model';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';
import { FwPageShellComponent } from '../../../../../shared/components/page-shell/page-shell.component';
import { FwButtonComponent } from '../../../../../shared/components/button/button.component';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { FwReportModalComponent, ReportItem } from '../../../../../shared/components/report-modal/report-modal';

@Component({
  selector: 'app-admission-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    LucideAngularModule, 
    FwPageShellComponent,
    FwButtonComponent,
    RouterLink,
    TranslateModule,
    MatDialogModule,
    FwReportModalComponent
  ],
  templateUrl: './admission-dashboard.component.html',
  styleUrls: ['./admission-dashboard.component.scss']
})
export class AdmissionDashboardComponent implements OnInit {
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  // --- ÉTATS ---
  applications = signal<Admission[]>([]);
  levels = signal<Level[]>([]);
  classes = signal<SchoolClass[]>([]);
  activeYear = signal<AcademicYear | null>(null);
  isLoading = signal(true);

  currentUser = this.authService.currentUser;

  // --- LOGIQUE MODALE ---
  openCapacityReport() {
    const stats = this.levelStats();

    const reportItems: ReportItem[] = stats.map(lvl => ({
      id: lvl.id,
      title: lvl.name,
      subtitle: `${lvl.capacity || 0} places théoriques`,
      value: `${lvl.occupancyRate}%`,
      subValue: `${lvl.validated} inscrits`,
      progress: lvl.occupancyRate,
      status: lvl.occupancyRate >= 90 ? 'danger' : (lvl.occupancyRate >= 75 ? 'warning' : 'neutral')
    }));

    this.dialog.open(FwReportModalComponent, {
      width: '720px',
      data: {
        title: 'Rapport d\'Occupation des Niveaux',
        subtitle: 'Analyse détaillée de la capacité physique et des inscriptions validées.',
        items: reportItems,
        searchPlaceholder: 'Rechercher un niveau (ex: CP, Terminale...)'
      }
    });
  }

  // --- VISION DIRECTION (STRATÉGIQUE) ---

  totalApps = computed(() => this.applications().length);
  newAppsCount = computed(() => this.applications().filter((a: Admission) => a.type === 'NEW_ENROLLMENT').length);
  reEnrollCount = computed(() => this.applications().filter((a: Admission) => a.type === 'RE_ENROLLMENT').length);

  conversionRate = computed(() => {
    if (this.totalApps() === 0) return 0;
    const validated = this.applications().filter((a: Admission) => a.status === 'VALIDATED').length;
    return Math.round((validated / this.totalApps()) * 100);
  });

  statusStats = computed(() => {
    const apps = this.applications();
    return {
      submitted: apps.filter((a: Admission) => a.status === 'SUBMITTED').length,
      verified: apps.filter((a: Admission) => a.status === 'VERIFIED').length,
      testing: apps.filter((a: Admission) => a.status === 'TESTING' || a.status === 'WAITLIST' || a.status === 'ADMITTED').length,
      validated: apps.filter((a: Admission) => a.status === 'VALIDATED').length,
      rejected: apps.filter((a: Admission) => a.status === 'REJECTED' || a.status === 'CANCELLED').length
    };
  });

  // --- VISION SECRÉTARIAT (OPÉRATIONNELLE) ---

  pendingVerification = computed(() => this.applications().filter((a: Admission) => a.status === 'SUBMITTED').length);
  pendingEvaluation = computed(() => this.applications().filter((a: Admission) => a.status === 'VERIFIED').length);
  pendingDecision = computed(() => this.applications().filter((a: Admission) => a.status === 'ADMITTED').length);

  incompleteDossiers = computed(() => {
    return this.applications().filter((a: Admission) => {
      if (['VALIDATED', 'REJECTED', 'CANCELLED'].includes(a.status)) return false;
      const mandatory = a.documents.filter(d => d.mandatory);
      return mandatory.some(d => d.status === 'MISSING' || d.status === 'REJECTED');
    }).length;
  });

  // --- ANALYSE DE CAPACITÉ ---

  levelStats = computed(() => {
    const apps = this.applications();
    const cls = this.classes();

    return this.levels().map(lvl => {
      const levelApps = apps.filter((a: Admission) => a.schooling?.levelId === lvl.id);
      const validatedCount = levelApps.filter((a: Admission) => a.status === 'VALIDATED').length;

      const totalCapacity = cls
        .filter(c => c.levelId === lvl.id)
        .reduce((sum, c) => sum + (c.capacity || 0), 0);

      const occupancyRate = totalCapacity > 0 ? Math.round((validatedCount / totalCapacity) * 100) : 0;

      return {
        id: lvl.id,
        name: lvl.name,
        count: levelApps.length,
        validated: validatedCount,
        capacity: totalCapacity,
        occupancyRate,
        isSaturated: occupancyRate >= 90
      };
    })
    .filter(l => l.count > 0 || l.capacity > 0)
    .sort((a, b) => b.occupancyRate - a.occupancyRate);
  });

  saturatedCount = computed(() => this.levelStats().filter(l => l.isSaturated).length);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    this.academicService.getCurrentYear().pipe(
      switchMap(year => {
        this.activeYear.set(year);
        return forkJoin({
          apps: this.enrollmentService.getApplications({size: 1000}),
          levels: this.academicService.getLevels(),
          classes: this.academicService.getClassesByYear(year.id)
        });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({apps, levels, classes}) => {
        this.applications.set(apps.content || []);
        this.levels.set(levels);
        this.classes.set(classes);
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
  readonly AlertTriangle = AlertTriangle;
  readonly ClipboardCheck = ClipboardCheck;
  readonly MessageSquare = MessageSquare;
  readonly Layers = Layers;
  readonly School = School;
  readonly Plus = Plus;
  readonly ArrowRight = ArrowRight;
  protected readonly Math = Math;
  protected readonly RefreshCw = RefreshCw;
}
