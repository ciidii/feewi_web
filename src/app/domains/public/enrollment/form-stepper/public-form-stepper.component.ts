import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  GraduationCap,
  HeartPulse,
  Info,
  LayoutGrid,
  Lock,
  LucideAngularModule,
  RefreshCw,
  User,
  Users
} from 'lucide-angular';
import {finalize, forkJoin, map, of, switchMap, tap} from 'rxjs';

import {EnrollmentPublicService} from '../../../../core/services/enrollment-public.service';
import {DocumentEngineService} from '../../../../core/services/document-engine.service';
import {AdmissionSessionService} from '../../../../core/services/admission-session.service';
import {AcademicService} from '../../../../core/services/academic.service';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {NotificationService} from '../../../../shared/services/notification.service';
import {
  Admission,
  CreateBundleRequest,
  EffectiveConfigResponse,
  FieldConfig,
  PublicPortalSummary
} from '../../../../core/models/enrollment.model';

import {StepFamilyComponent} from './components/step-family/step-family.component';
import {StepIdentityComponent} from './components/step-identity/step-identity.component';
import {StepMedicalComponent} from './components/step-medical/step-medical.component';
import {StepServicesComponent} from './components/step-services/step-services.component';
import {StepVaultComponent} from './components/step-vault/step-vault.component';
import {StepReviewComponent} from './components/step-review/step-review.component';

export type StepperStep = 'GUARDIAN' | 'STUDENT' | 'MEDICAL' | 'SERVICES' | 'DOCS' | 'REVIEW';

@Component({
  selector: 'app-public-form-stepper',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule,
    StepFamilyComponent, StepIdentityComponent, StepMedicalComponent,
    StepServicesComponent, StepVaultComponent, StepReviewComponent
  ],
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
  consent = {checked: false};
  isPortalClosed = signal(false);

  // --- CONTEXTE ---
  summary = signal<PublicPortalSummary | null>(null);
  effectiveConfig = signal<EffectiveConfigResponse | null>(null);
  availableLevels = signal<any[]>([]);
  targetYearId = signal<string | null>(null);

  // --- DOMAIN DATA ---
  application = signal<Admission | null>(null); // L'Admission (Enfant) individuelle
  bundleId = signal<string | null>(null);       // L'ID du dossier familial (Bundle)

  formStore: any = {
    pillar_family: {
      relation: 'FATHER',
      email: '',
      lastName: '',
      firstName: '',
      phone: '',
      homeAddress: '',
      customFields: {}
    },
    pillar_identity: {firstName: '', lastName: '', gender: 'MALE', birthDate: '', customFields: {}},
    pillar_medical: {bloodGroup: '', criticalAllergies: '', customFields: {}},
    pillar_schooling: {levelId: '', customFields: {}},
    services: {canteen: false, transport: false, insurance: false}
  };

  bundleRef = signal<string>('');
  accessCode = signal<string>('');

  progress = computed(() => {
    const steps = this.getFilteredSteps();
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  ngOnInit() {
    this.targetYearId.set(this.route.snapshot.queryParamMap.get('yearId'));
    this.loadBootstrapData();
  }

  private loadBootstrapData() {
    this.isLoading.set(true);
    forkJoin({
      summary: this.enrollmentService.getPortalConfigSummary(),
      levels: this.academicService.getLevels()
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: ({summary, levels}) => {
        this.summary.set(summary);
        this.availableLevels.set(levels);
        if (summary && !summary.portalActive) this.isPortalClosed.set(true);
        if (levels.length > 0) {
          this.enrollmentService.getEffectiveConfig(levels[0].id).subscribe(cfg => this.effectiveConfig.set(cfg));
        }
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
        this.bundleId.set(app.bundleId);
        this.bundleRef.set(session.reference);
        this.accessCode.set(session.accessCode);
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
    if (!app) return;
    this.formStore.pillar_family = {
      ...app.family?.primaryGuardian,
      homeAddress: app.family?.homeAddress,
      customFields: app.family?.customFields || {}
    };
    this.formStore.pillar_identity = {...app.identity, customFields: app.identity?.customFields || {}};
    this.formStore.pillar_medical = {...app.medical, customFields: app.medical?.customFields || {}};
    this.formStore.pillar_schooling = {...app.schooling, customFields: app.schooling?.customFields || {}};
  }

  getSystemField(pillarKey: string, fieldName: string): FieldConfig | null {
    const pillar = this.effectiveConfig()?.pillars[pillarKey];
    return pillar?.systemFields.find(f => f.name === fieldName) || null;
  }

  onLevelChange(levelId: string) {
    if (levelId) {
      this.enrollmentService.getEffectiveConfig(levelId).subscribe(config => this.effectiveConfig.set(config));
    }
  }

  getFilteredSteps(): StepperStep[] {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL'];
    if (this.effectiveConfig()?.enabledServices?.length) steps.push('SERVICES');
    steps.push('DOCS', 'REVIEW');
    return steps;
  }

  async nextStep() {
    const steps = this.getFilteredSteps();
    const currentIndex = steps.indexOf(this.currentStep());
    this.isSubmitting.set(true);
    let success = false;

    try {
      if (this.currentStep() === 'GUARDIAN') {
        console.log("---avant handle guardian -----------------")
        success = await this.handleGuardianTransition();
        console.log("---apres handle guardian -----------------")

      } else {
        const pillarKey = this.currentStep() === 'STUDENT' ? 'pillar_identity' :
          this.currentStep() === 'MEDICAL' ? 'pillar_medical' :
            this.currentStep() === 'SERVICES' ? 'pillar_services' : null;

        if (pillarKey) {
          success = await this.syncActivePillar(pillarKey);
          if (success && this.currentStep() === 'STUDENT') {
            success = await this.syncActivePillar('pillar_schooling');
          }
        } else {
          success = true; // Pour DOCS et REVIEW
        }
      }
      if (currentIndex < steps.length - 1) {
        const next = steps[currentIndex + 1];
        this.currentStep.set(next);
        this.sessionService.updateStep(next);
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async handleGuardianTransition(): Promise<boolean> {
    const familyData = this.formStore.pillar_family;
    const bid = this.bundleId();

    const payload = {
      primaryGuardian: {
        firstName: familyData.firstName,
        lastName: familyData.lastName,
        email: familyData.email,
        phone: familyData.phone,
        relation: familyData.relation,
        isFinancialResponsible: true
      },
      homeAddress: familyData.homeAddress,
      customFields: familyData.customFields
    };

    if (bid) {
      // V6 : PATCH /admissions/bundles/{id}/pillars/pillar_family
      const res = await this.enrollmentService.updateFamilyPillar(bid, payload).toPromise();
      return !!res;
    } else {
      // V6 : POST /admissions (Create Bundle + First Admission)
      const initPayload: CreateBundleRequest = {
        tenantId: this.tenantContext.activeTenant()?.id || '',
        family: payload,
        children: [{
          firstName: this.formStore.pillar_identity.firstName || 'Candidat',
          lastName: this.formStore.pillar_identity.lastName || familyData.lastName || 'Candidat',
          gender: this.formStore.pillar_identity.gender || 'MALE',
          academicYearId: this.targetYearId() || 'current',
          levelId: this.formStore.pillar_schooling.levelId || 'TEMP'
        }]
      };

      const res = await this.enrollmentService.createApplication(initPayload).toPromise();
      if (res && res.id) {
        this.bundleId.set(res.id);
        this.bundleRef.set(res.reference);
        this.accessCode.set(res.accessCode);

        // On récupère l'ID de la première admission créée par le backend
        if (res.admissions && res.admissions.length > 0) {
          this.application.set(res.admissions[0]);
          this.sessionService.saveSession(res.reference, res.accessCode, familyData.firstName || 'Parent', 'STUDENT');
          return true;
        }
      }
    }
    return false;
  }

  /** V6 : PATCH /admissions/{id}/pillars/{pillarKey} */
  private async syncActivePillar(pillarKey: string): Promise<boolean> {
    const aid = this.application()?.id;
    if (!aid) {
      this.notificationService.error("ID Admission manquant. Veuillez recommencer.");
      return false;
    }

    try {
      const data = pillarKey === 'pillar_services' ? this.formStore.services : this.formStore[pillarKey];
      const updated = await this.enrollmentService.updateChildPillar(aid, pillarKey, data).toPromise();
      if (updated) {
        this.application.set(updated);
        return true;
      }
    } catch (e) {
      console.error(`[Stepper] Sync error ${pillarKey}`, e);
    }
    return false;
  }

  prevStep() {
    const steps = this.getFilteredSteps();
    const idx = steps.indexOf(this.currentStep());
    if (idx > 0) this.currentStep.set(steps[idx - 1]);
  }

  hasService(code: string): boolean {
    return this.effectiveConfig()?.enabledServices?.includes(code) || false;
  }

  onVaultFileSelected(data: { code: string, event: any }) {
    const file = data.event.target.files[0];
    const aid = this.application()?.id;
    if (!file || !aid) return;

    this.uploadingDocCode.set(data.code);
    this.documentService.getUploadTicket({
      fileName: file.name,
      contentType: file.type,
      serviceOrigin: 'enrollment'
    }).pipe(
      switchMap(ticket => this.documentService.uploadFileDirectly(ticket.uploadUrl, file).pipe(map(() => ticket))),
      switchMap(ticket => this.enrollmentService.uploadDocument(aid, data.code, ticket.fileId)),
      finalize(() => this.uploadingDocCode.set(null))
    ).subscribe(app => this.application.set(app));
  }

  submitFinal() {
    const aid = this.application()?.id;
    if (!aid) return;
    this.isSubmitting.set(true);
    this.enrollmentService.submitApplication(aid).pipe(finalize(() => this.isSubmitting.set(false))).subscribe(res => {
      this.sessionService.clearSession();
      this.router.navigate(['/enrollment/tracker', res.reference], {queryParams: {accessCode: this.accessCode()}});
    });
  }

  readonly GraduationCap = GraduationCap;
  readonly Users = Users;
  readonly User = User;
  readonly HeartPulse = HeartPulse;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly Lock = Lock;
  readonly Info = Info;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  protected readonly RefreshCw = RefreshCw;
  protected readonly LayoutGrid = LayoutGrid;
}
