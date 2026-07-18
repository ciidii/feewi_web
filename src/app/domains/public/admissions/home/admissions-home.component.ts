import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  Info,
  Lock,
  LucideAngularModule,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-angular';
import {EnrollmentPublicService} from '../../../../core/services/enrollment-public.service';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {finalize} from 'rxjs';
import {PublicPortalSummary} from '../../../../core/models/enrollment';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {SplashScreenComponent} from '../../../../shared/components/loader/splash-screen.component';
import {FwDatePipe} from '../../../../shared/pipes/fw-date.pipe';

@Component({
  selector: 'app-admissions-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FwButtonComponent, SplashScreenComponent, FwDatePipe],
  templateUrl: './admissions-home.component.html',
  styleUrls: ['./admissions-home.component.scss']
})
export class AdmissionsHomeComponent implements OnInit {
  private enrollmentService = inject(EnrollmentPublicService);
  tenantCtx = inject(TenantContextService);

  summary = signal<PublicPortalSummary | null>(null);
  isLoading = signal(true);
  isError = signal(false);

  yearCards = computed(() => {
    const years = this.summary()?.availableYears ?? [];
    return years.map(y => {
      const types = y.allowedTypes || [];
      return {
        ...y,
        isAdminOnly: y.registrationMode === 'ADMIN_ONLY',
        canNewEnrollment: types.includes('NEW_ENROLLMENT'),
        canReEnrollment: types.includes('RE_ENROLLMENT'),
        hasBothTypes: types.length === 2
      };
    });
  });

  noYearsAvailable = computed(() =>
    this.summary() !== null && this.yearCards().length === 0
  );

  welcomeMessage = computed(() =>
    this.yearCards().find(y => y.active)?.welcomeMessage
      ?? this.yearCards()[0]?.welcomeMessage
      ?? null
  );

  yearStateLabel(state: string): string {
    switch (state) {
      case 'PLANNING':  return 'Pré-inscriptions';
      case 'ACTIVE':    return 'Campagne Active';
      case 'CLOSING':   return 'Derniers jours';
      default:          return 'Campagne';
    }
  }

  yearStateClass(state: string): string {
    switch (state) {
      case 'PLANNING': return 'is-planning';
      case 'CLOSING':  return 'is-closing';
      default:         return '';
    }
  }

  ngOnInit() {
    // Le tenant est garanti résolu par le tenantResolver posé sur la route parente.
    this.loadSummary();
  }

  loadSummary() {
    this.isLoading.set(true);
    this.isError.set(false);
    this.enrollmentService.getPortalSummary().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data: PublicPortalSummary) => this.summary.set(data),
      error: () => this.isError.set(true)
    });
  }

  // Icônes
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly Sparkles = Sparkles;
  readonly Search = Search;
  readonly ArrowRight = ArrowRight;
  readonly Info = Info;
  readonly Calendar = Calendar;
  readonly FileText = FileText;
  readonly ShieldCheck = ShieldCheck;
  readonly Globe = Globe;
  readonly Phone = Phone;
  readonly RefreshCw = RefreshCw;
  readonly GraduationCap = GraduationCap;
  readonly ChevronRight = ChevronRight;
  readonly AlertCircle = AlertCircle;
  readonly Lock = Lock;
}
