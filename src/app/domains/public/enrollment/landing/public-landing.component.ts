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
  Globe, RefreshCw
} from 'lucide-angular';
import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { finalize } from 'rxjs';
import {PublicPortalSummary} from '../../../../core/models/enrollment';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss']
})
export class PublicLandingComponent implements OnInit {
  private enrollmentService = inject(EnrollmentPublicService);

  summary = signal<PublicPortalSummary | null>(null);
  isLoading = signal(true);

  // V5 : Liste des années filtrées (uniquement celles marquées actives dans le CMS)
  activeYears = computed(() => {
    return this.summary()?.availableYears.filter(y => y.active) || [];
  });

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
  protected readonly RefreshCw = RefreshCw;
}
