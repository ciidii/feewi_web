import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  GraduationCap,
  LucideAngularModule,
  Search,
  Sparkles,
} from 'lucide-angular';
import {catchError, finalize, forkJoin, of} from 'rxjs';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {ShowcaseContentService} from '../../../../core/services/showcase-content.service';
import {EnrollmentPublicService} from '../../../../core/services/enrollment-public.service';
import {SchoolBranding, ExamResult, GalleryPhoto, PricingPlan} from '../../../../core/models/showcase';
import {PublicPortalSummary} from '../../../../core/models/enrollment';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {BlockLoaderComponent} from '../../../../shared/components/loader/block-loader.component';
import {ExamResultCardComponent} from '../shared/exam-result-card/exam-result-card.component';

@Component({
  selector: 'app-showcase-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FwButtonComponent, BlockLoaderComponent, ExamResultCardComponent],
  templateUrl: './showcase-home.component.html',
  styleUrls: ['./showcase-home.component.scss']
})
export class ShowcaseHomeComponent implements OnInit {
  private showcaseService = inject(ShowcaseContentService);
  private enrollmentService = inject(EnrollmentPublicService);
  tenantCtx = inject(TenantContextService);

  isLoading = signal(true);
  branding = signal<SchoolBranding | null>(null);
  examResults = signal<ExamResult[]>([]);
  galleryPreview = signal<GalleryPhoto[]>([]);
  pricingPlans = signal<PricingPlan[]>([]);
  portalSummary = signal<PublicPortalSummary | null>(null);

  recentResults = computed(() => this.examResults().slice(0, 3));
  activeCampaign = computed(() =>
    this.portalSummary()?.availableYears?.find(y => y.active) ?? null
  );

  ngOnInit() {
    const tenantId = this.tenantCtx.activeTenant()!.id;

    forkJoin({
      branding: this.showcaseService.getBranding(tenantId),
      examResults: this.showcaseService.getExamResults(tenantId),
      gallery: this.showcaseService.getGalleryAlbums(tenantId),
      pricing: this.showcaseService.getPricingPlans(tenantId),
      portalSummary: this.enrollmentService.getPortalSummary().pipe(catchError(() => of(null))),
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({branding, examResults, gallery, pricing, portalSummary}) => {
      this.branding.set(branding);
      this.examResults.set(examResults);
      this.galleryPreview.set(gallery.flatMap(album => album.photos).slice(0, 6));
      this.pricingPlans.set(pricing);
      this.portalSummary.set(portalSummary);
    });
  }

  readonly ArrowRight = ArrowRight;
  readonly Search = Search;
  readonly Sparkles = Sparkles;
  readonly Award = Award;
  readonly Camera = Camera;
  readonly CheckCircle2 = CheckCircle2;
  readonly GraduationCap = GraduationCap;
}
