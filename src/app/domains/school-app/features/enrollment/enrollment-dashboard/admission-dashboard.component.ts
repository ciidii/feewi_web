import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LucideAngularModule,
  Plus,
  RefreshCw,
  School,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Users
} from 'lucide-angular';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {EnrollmentDashboardStats, LevelCapacityStat} from '../../../../../core/models/enrollment.model';
import {finalize} from 'rxjs';
import {AuthService} from '../../../../../core/services/auth.service';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {RouterLink} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {FwReportModalComponent, ReportItem} from '../../../../../shared/components/report-modal/report-modal';

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
    MatDialogModule
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
  dashboardData = signal<EnrollmentDashboardStats | null>(null);
  isLoading = signal(true);

  currentUser = this.authService.currentUser;
  canSubmit = computed(() => this.authService.hasPermission('enrollment:admission:submit'));

  // --- LOGIQUE MODALE ---
  openCapacityReport() {
    const stats = this.dashboardData()?.capacity.levels || [];

    const reportItems: ReportItem[] = stats.map((lvl: LevelCapacityStat) => ({
      id: lvl.id,
      title: lvl.name,
      subtitle: `${lvl.totalCapacity || 0} places théoriques`,
      value: `${lvl.occupancyRate}%`,
      subValue: `${lvl.validated} inscrits`,
      progress: lvl.occupancyRate,
      status: lvl.isSaturated ? 'danger' : (lvl.occupancyRate >= 75 ? 'warning' : 'neutral')
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

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.enrollmentService.getDashboardStats().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => this.dashboardData.set(data),
      error: (err) => console.error('Dashboard Load Error:', err)
    });
  }

  // Icônes pour le template
  readonly Users = Users; // In plan it was removed but template might need it
  readonly GraduationCap = GraduationCap;
  readonly TrendingUp = TrendingUp;
  readonly Activity = Activity;
  readonly Clock = Clock;
  readonly ShieldCheck = ShieldCheck;
  readonly FileText = FileText;
  readonly LayoutDashboard = LayoutDashboard;
  readonly AlertTriangle = AlertTriangle;
  readonly ClipboardCheck = ClipboardCheck;
  readonly School = School;
  readonly Plus = Plus;
  readonly ArrowRight = ArrowRight;
  readonly XCircle = XCircle;
  protected readonly RefreshCw = RefreshCw;
}
