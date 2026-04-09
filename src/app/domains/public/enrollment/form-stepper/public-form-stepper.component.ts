import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  LucideAngularModule, ArrowLeft, ArrowRight, CheckCircle, FileText, 
  GraduationCap, RefreshCw, Upload, User, Users, HeartPulse, 
  ShieldCheck, Globe, Lock, Info, Sparkles 
} from 'lucide-angular';
import { catchError, delay, finalize, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { DocumentEngineService } from '../../../../core/services/document-engine.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Admission, EffectiveConfigResponse, PublicPortalSummary, PillarConfig } from '../../../../core/models/enrollment.model';

export type StepperStep = 'GUARDIAN' | 'STUDENT' | 'MEDICAL' | 'DOCS' | 'REVIEW';

@Component({
  selector: 'app-public-form-stepper',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './public-form-stepper.component.html',
  styleUrls: ['./public-form-stepper.component.scss']
})
export class PublicFormStepperComponent implements OnInit {
  private enrollmentService = inject(EnrollmentPublicService);
  private documentService = inject(DocumentEngineService);
  private sessionService = inject(AdmissionSessionService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  public tenantContext = inject(TenantContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- ÉTATS ---
  currentStep = signal<StepperStep>('GUARDIAN');
  isLoading = signal(false);
  isSubmitting = signal(false);
  uploadingDocCode = signal<string | null>(null);
  consentChecked = signal(false);
  isPortalClosed = signal(false);

  // --- CONTEXT STATE ---
  summary = signal<PublicPortalSummary | null>(null);
  effectiveConfig = signal<EffectiveConfigResponse | null>(null);
  availableLevels = signal<any[]>([]);
  targetYearId = signal<string | null>(null);

  // --- DOMAIN DATA ---
  application = signal<Admission | null>(null);
  formStore: any = {
    pillar_family: { relation: 'FATHER', customFields: {} },
    pillar_identity: { gender: 'MALE', customFields: {} },
    pillar_medical: { customFields: {} },
    pillar_schooling: { levelId: '', customFields: {} }
  };

  // --- CALCULS ---
  progress = computed(() => {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL', 'DOCS', 'REVIEW'];
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  ngOnInit() {
    this.targetYearId.set(this.route.snapshot.queryParamMap.get('yearId'));
    this.loadBootstrapData();
  }

  private loadBootstrapData() {
    this.isLoading.set(true);
    forkJoin({
      summary: this.enrollmentService.getPortalSummary(),
      levels: this.academicService.getLevels()
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: ({ summary, levels }) => {
        this.summary.set(summary);
        this.availableLevels.set(levels);
        if (summary && !summary.portalActive) this.isPortalClosed.set(true);
        this.checkExistingSession();
      }
    });
  }

  private checkExistingSession() {
    const session = this.sessionService.getSession();
    if (!session) return;

    this.isSubmitting.set(true);
    this.enrollmentService.trackApplication(session.reference, session.accessCode).pipe(
      tap(app => {
        this.application.set(app);
        this.syncStoreFromApp(app);
      }),
      switchMap(app => app.schooling?.levelId ? this.enrollmentService.getEffectiveConfig(app.schooling.levelId) : of(null)),
      finalize(() => this.isSubmitting.set(false))
    ).subscribe(config => {
      if (config) this.effectiveConfig.set(config);
      if (session.currentStep) this.currentStep.set(session.currentStep as StepperStep);
    });
  }

  private syncStoreFromApp(app: Admission) {
    this.formStore = {
      pillar_family: { ...app.family?.primaryGuardian, homeAddress: app.family?.homeAddress, ...app.family?.customFields },
      pillar_identity: { ...app.identity, ...app.identity?.customFields },
      pillar_medical: { ...app.medical, ...app.medical?.customFields },
      pillar_schooling: { ...app.schooling, ...app.schooling?.customFields }
    };
  }

  /** Phase 4 : Intelligence Opérationnelle - Rechargement config sur changement de niveau */
  onLevelChange() {
    const levelId = this.formStore.pillar_schooling.levelId;
    if (levelId) {
      this.enrollmentService.getEffectiveConfig(levelId).subscribe(config => {
        this.effectiveConfig.set(config);
      });
    }
  }

  // --- MOTEUR DE NAVIGATION ---

  async nextStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    this.isSubmitting.set(true);
    let success = false;

    try {
      if (this.currentStep() === 'GUARDIAN') {
        success = await this.handleGuardianTransition();
      } else if (this.currentStep() === 'STUDENT') {
        success = await this.syncActivePillar('pillar_identity');
        if (success) success = await this.syncActivePillar('pillar_schooling');
      } else if (this.currentStep() === 'MEDICAL') {
        success = await this.syncActivePillar('pillar_medical');
      } else {
        success = true;
      }

      if (success && currentIndex < steps.length - 1) {
        const next = steps[currentIndex + 1];
        this.currentStep.set(next);
        this.sessionService.updateStep(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally { this.isSubmitting.set(false); }
  }

  private async handleGuardianTransition(): Promise<boolean> {
    const app = this.application();
    const familyData = this.formStore['pillar_family'];

    if (app?.bundleId) {
      const res = await this.enrollmentService.updateFamilyPillar(app.bundleId, familyData).toPromise();
      return !!res;
    } else {
      const res = await this.enrollmentService.createApplication({
        tenantId: this.tenantContext.activeTenant()?.id || '',
        family: familyData,
        children: [{
          firstName: this.formStore['pillar_identity'].firstName || 'Candidat',
          lastName: this.formStore['pillar_identity'].lastName || familyData.lastName,
          gender: this.formStore['pillar_identity'].gender || 'MALE',
          academicYearId: this.targetYearId() || 'current',
          levelId: this.formStore['pillar_schooling'].levelId || 'TEMP'
        }]
      } as any).toPromise();

      if (res && res.admissions.length > 0) {
        const first = res.admissions[0];
        this.application.set(first);
        this.sessionService.saveSession(first.reference, res.accessCode, first.identity.firstName, 'STUDENT');
        return true;
      }
    }
    return false;
  }

  private async syncActivePillar(pillarKey: string): Promise<boolean> {
    const id = this.application()?.id;
    if (!id) return false;

    try {
      const data = this.formStore[pillarKey];
      const updated = await this.enrollmentService.updateChildPillar(id, pillarKey, data).toPromise();
      if (updated) {
        this.application.set(updated);
        return true;
      }
    } catch (e) { console.error(`[Stepper] Sync error ${pillarKey}`, e); }
    return false;
  }

  prevStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL', 'DOCS', 'REVIEW'];
    const idx = steps.indexOf(this.currentStep());
    if (idx > 0) this.currentStep.set(steps[idx - 1]);
  }

  getPillarConfig(key: string) {
    return this.effectiveConfig()?.pillars[key] || null;
  }

  onFileSelected(docCode: string, event: any) {
    const file = event.target.files[0];
    const id = this.application()?.id;
    if (!file || !id) return;

    this.uploadingDocCode.set(docCode);
    this.documentService.getUploadTicket({ fileName: file.name, contentType: file.type, serviceOrigin: 'enrollment' }).pipe(
      switchMap(ticket => this.documentService.uploadFileDirectly(ticket.uploadUrl, file).pipe(map(() => ticket))),
      switchMap(ticket => this.enrollmentService.uploadDocument(id, docCode, ticket.fileId)),
      finalize(() => this.uploadingDocCode.set(null))
    ).subscribe(app => this.application.set(app));
  }

  submitFinal() {
    const id = this.application()?.id;
    if (!id) return;
    this.isSubmitting.set(true);
    this.enrollmentService.submitApplication(id).pipe(finalize(() => this.isSubmitting.set(false))).subscribe(res => {
      this.sessionService.clearSession();
      this.router.navigate(['/enrollment/tracker', res.reference], { queryParams: { accessCode: this.application()?.bundleId } });
    });
  }

  // Icônes
  readonly GraduationCap = GraduationCap;
  readonly User = User;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Upload = Upload;
  readonly RefreshCw = RefreshCw;
  readonly HeartPulse = HeartPulse;
  readonly ShieldCheck = ShieldCheck;
  readonly Globe = Globe;
  readonly Lock = Lock;
  readonly Info = Info;
  readonly Sparkles = Sparkles;
}
