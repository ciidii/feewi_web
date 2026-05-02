import { Component, inject, OnInit, signal, computed, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  ArrowRight,
  Info,
  Calendar,
  FileText,
  ShieldCheck,
  Globe, RefreshCw, Phone, GraduationCap, ChevronRight, AlertCircle, Lock
} from 'lucide-angular';
import { toObservable } from '@angular/core/rxjs-interop';
import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { filter, finalize, take } from 'rxjs';
import { PublicPortalSummary } from '../../../../core/models/enrollment';
import { FwButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FwButtonComponent],
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
    return years.map(y => ({
      ...y,
      isAdminOnly: y.registrationMode === 'ADMIN_ONLY',
      canNewEnrollment: y.allowedTypes.includes('NEW_ENROLLMENT'),
      canReEnrollment: y.allowedTypes.includes('RE_ENROLLMENT'),
      hasBothTypes: y.allowedTypes.length === 2
    }));
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
