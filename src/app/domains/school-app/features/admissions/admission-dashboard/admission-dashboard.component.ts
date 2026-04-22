import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Activity,
  AlertTriangle,
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
  RefreshCw,
  School,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-angular';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {Admission} from '../../../../../core/models/enrollment.model';
import {AcademicYear, Level, SchoolClass} from '../../../../../core/models/academic.model';
import {finalize, forkJoin, switchMap} from 'rxjs';
import { AuthService } from '../../../../../core/services/auth.service';
import { FwPageShellComponent } from '../../../../../shared/components/page-shell/page-shell.component';
import { FwButtonComponent } from '../../../../../shared/components/button/button.component';
import { FwBadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admission-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwBadgeComponent,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './admission-dashboard.component.html',
  styleUrls: ['./admission-dashboard.component.scss']
})
export class AdmissionDashboardComponent implements OnInit {
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);

  // --- ÉTATS ---
  applications = signal<Admission[]>([]);
  levels = signal<Level[]>([]);
  classes = signal<SchoolClass[]>([]);
  activeYear = signal<AcademicYear | null>(null);
  isLoading = signal(true);

  currentUser = this.authService.currentUser;

  // --- VISION DIRECTION (STRATÉGIQUE) ---

  totalApps = computed(() => this.applications().length);
  newAppsCount = computed(() => this.applications().filter(a => a.type === 'NEW_ENROLLMENT').length);
  reEnrollCount = computed(() => this.applications().filter(a => a.type === 'RE_ENROLLMENT').length);

  conversionRate = computed(() => {
    if (this.totalApps() === 0) return 0;
    const validated = this.applications().filter(a => a.status === 'VALIDATED').length;
    return Math.round((validated / this.totalApps()) * 100);
  });

  statusStats = computed(() => {
    const apps = this.applications();
    return {
      submitted: apps.filter(a => a.status === 'SUBMITTED').length,
      verified: apps.filter(a => a.status === 'VERIFIED').length,
      testing: apps.filter(a => a.status === 'TESTING' || a.status === 'WAITLIST' || a.status === 'ADMITTED').length,
      validated: apps.filter(a => a.status === 'VALIDATED').length,
      rejected: apps.filter(a => a.status === 'REJECTED' || a.status === 'CANCELLED').length
    };
  });

  // --- VISION SECRÉTARIAT (OPÉRATIONNELLE) ---

  pendingVerification = computed(() => this.applications().filter(a => a.status === 'SUBMITTED').length);
  pendingEvaluation = computed(() => this.applications().filter(a => a.status === 'VERIFIED').length);
  pendingDecision = computed(() => this.applications().filter(a => a.status === 'ADMITTED').length);

  incompleteDossiers = computed(() => {
    return this.applications().filter(a => {
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
      const levelApps = apps.filter(a => a.schooling?.levelId === lvl.id);
      const validatedCount = levelApps.filter(a => a.status === 'VALIDATED').length;

      // Capacité totale du niveau (somme des classes)
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
    }).sort((a, b) => b.count - a.count);
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
  protected readonly RefreshCw = RefreshCw;
  protected readonly Math = Math;
  protected readonly Layers = Layers;
  protected readonly School = School;
}
