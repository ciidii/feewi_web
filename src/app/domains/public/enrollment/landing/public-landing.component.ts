import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
  Globe, RefreshCw, Phone, GraduationCap, ChevronRight
} from 'lucide-angular';
import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { finalize } from 'rxjs';
import { PublicPortalSummary } from '../../../../core/models/enrollment';
import { FwButtonComponent } from '../../../../shared/components/button/button.component';
import { FwPublicHeaderComponent } from '../../../../shared/layout/public-header/public-header.component';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FwButtonComponent, FwPublicHeaderComponent],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss']
})
export class PublicLandingComponent implements OnInit {
  private enrollmentService = inject(EnrollmentPublicService);

  summary = signal<PublicPortalSummary | null>(null);
  isLoading = signal(true);

  activeYears = computed(() =>
    this.summary()?.availableYears.filter(y => y.active) ?? []
  );

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
    this.summary() !== null && this.activeYears().length === 0
  );

  welcomeMessage = computed(() =>
    this.activeYears()[0]?.welcomeMessage ?? null
  );

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary() {
    this.isLoading.set(true);
    this.enrollmentService.getPortalSummary().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe((data: PublicPortalSummary) => {
      this.summary.set(data);
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
}
