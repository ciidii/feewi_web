import {Component, computed, inject, Injector, OnInit, signal} from '@angular/core';
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
import {toObservable} from '@angular/core/rxjs-interop';
import {EnrollmentPublicService} from '../../../../core/services/enrollment-public.service';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {filter, finalize, take} from 'rxjs';
import {PublicPortalSummary} from '../../../../core/models/enrollment';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {SplashScreenComponent} from '../../../../shared/components/loader/splash-screen.component';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FwButtonComponent, SplashScreenComponent],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss']
})
export class PublicLandingComponent implements OnInit {
  private enrollmentService = inject(EnrollmentPublicService);
  private injector = inject(Injector);
  tenantCtx = inject(TenantContextService);

  summary = signal<PublicPortalSummary | null>(null);
  isLoading = signal(true);
  isError = signal(false);

  schoolInitials = computed(() => {
    const name = this.tenantCtx.activeTenant()?.name ?? '';
    return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'EC';
  });

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
    // Le tenant est résolu de manière async par le layout parent.
    // On attend qu'il soit disponible avant de charger le portail.
    toObservable(this.tenantCtx.activeTenant, { injector: this.injector })
      .pipe(
        filter(tenant => tenant !== null),
        take(1)
      )
      .subscribe(() => this.loadSummary());
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
