import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArrowLeft, ArrowRight, CheckCircle, FileText, GraduationCap,
  HeartPulse, Info, LayoutGrid, Lock, LucideAngularModule,
  RefreshCw, User, Users
} from 'lucide-angular';
import { finalize, forkJoin, switchMap } from 'rxjs';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { DocumentEngineService } from '../../../../core/services/document-engine.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../shared/services/notification.service';

import {
  Admission, AdmissionBundle
} from '../../../../core/models/enrollment/entities';
import {
  AddChildRequest,
  CreateBundleRequest,
  DefaultConfigResponse,
  ServiceSubscriptionRequest,
} from '../../../../core/models/enrollment/dtos';

import { StepFamilyComponent } from './components/step-family/step-family.component';
import { StepIdentityComponent } from './components/step-identity/step-identity.component';
import { StepMedicalComponent } from './components/step-medical/step-medical.component';
import { StepServicesComponent } from './components/step-services/step-services.component';
import { StepVaultComponent } from './components/step-vault/step-vault.component';
import { StepReviewComponent } from './components/step-review/step-review.component';

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
  isPortalClosed = signal(false);
  consent = { checked: false };

  // --- CONTEXTE ---
  config = signal<DefaultConfigResponse | null>(null);
  levelConfig = signal<any | null>(null);
  availableLevels = signal<any[]>([]);
  targetYearId = signal<string | null>(null);
  admissionType = signal<'NEW_ENROLLMENT' | 'RE_ENROLLMENT'>('NEW_ENROLLMENT');

  // --- DOMAIN ---
  bundle = signal<AdmissionBundle | null>(null);
  admission = signal<Admission | null>(null);

  effectiveSchema = computed(() => this.levelConfig()?.schema ?? this.config()?.schema);

  // Données de formulaire locales (source de vérité UI)
  formStore = {
    family: {
      primaryGuardian: {
        firstName: '', lastName: '', email: '',
        phone: '', relation: 'FATHER', financialResponsible: true,
        customFields: {} as Record<string, any>
      },
      customFields: { homeAddress: '' } as Record<string, any>
    },
    identity: {
      firstName: '', lastName: '', gender: 'MALE' as 'MALE' | 'FEMALE',
      birthDate: '', birthPlace: '',
      customFields: {} as Record<string, any>
    },
    schooling: {
      academicYearId: '', levelId: '',
      cycleType: undefined as string | undefined,
      filiereId: null as string | null,
      customFields: {} as Record<string, any>
    },
    medical: {
      customFields: {} as Record<string, any>
    },
    services: [] as ServiceSubscriptionRequest[]
  };

  availableServiceCodes = computed(() =>
    this.config()?.schema?.services?.availableServices?.map(s => s.code) ?? []
  );

  selectedLevelName = computed(() => {
    const levelId = this.formStore.schooling.levelId;
    return this.availableLevels().find(l => l.id === levelId)?.name ?? levelId;
  });

  progress = computed(() => {
    const steps = this.getFilteredSteps();
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  bundleRef = computed(() => this.bundle()?.reference ?? '');
  accessCode = computed(() => this.bundle()?.accessCode ?? '');

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.targetYearId.set(params.get('yearId'));
    this.admissionType.set((params.get('type') as any) ?? 'NEW_ENROLLMENT');
    this.loadBootstrapData();
  }

  private loadBootstrapData() {
    this.isLoading.set(true);
    forkJoin({
      config: this.enrollmentService.getDefaultConfig(),
      levels: this.academicService.getLevels()
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: ({ config, levels }) => {
        this.config.set(config);
        this.availableLevels.set(levels);
        if (!config.portalActive) this.isPortalClosed.set(true);
        this.checkExistingSession();
      }
    });
  }

  private checkExistingSession() {
    const session = this.sessionService.getSession();
    if (!session) return;

    this.isLoading.set(true);
    this.enrollmentService.getBundle(session.bundleId, session.accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (bundle) => {
        this.bundle.set(bundle);
        const firstAdmission = bundle.admissions?.[0] ?? null;
        this.admission.set(firstAdmission);
        if (firstAdmission) {
          this.syncStoreFromAdmission(bundle, firstAdmission);
          if (firstAdmission.schooling?.levelId) {
            this.enrollmentService.getLevelConfig(firstAdmission.schooling.levelId).subscribe(cfg => {
              this.levelConfig.set(cfg);
            });
          }
        }
        if (session.currentStep) this.currentStep.set(session.currentStep as StepperStep);
      },
      error: () => this.sessionService.clearSession()
    });
  }

  private syncStoreFromAdmission(bundle: AdmissionBundle, adm: Admission) {
    this.formStore.family = {
      primaryGuardian: { ...bundle.family.primaryGuardian, email: bundle.family.primaryGuardian.email ?? '', customFields: bundle.family.primaryGuardian.customFields ?? {} },
      customFields: bundle.family.customFields ?? { homeAddress: '' }
    };
    this.formStore.identity = { ...adm.identity, customFields: adm.identity.customFields ?? {} };
    this.formStore.schooling = { ...adm.schooling, cycleType: adm.schooling.cycleType ?? undefined, filiereId: adm.schooling.filiereId ?? null, customFields: adm.schooling.customFields ?? {} };
    this.formStore.medical = { customFields: adm.medical?.customFields ?? {} };
  }

  onLevelChange(levelId: string) {
    if (!levelId) return;
    this.formStore.schooling.levelId = levelId;
    
    // Dériver le cycleType depuis la liste des niveaux
    const level = this.availableLevels().find(l => l.id === levelId);
    if (level?.cycleType) {
      this.formStore.schooling.cycleType = level.cycleType;
    }

    this.enrollmentService.getLevelConfig(levelId).subscribe(cfg => {
      this.levelConfig.set(cfg);
    });
  }

  getFilteredSteps(): StepperStep[] {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL'];
    if (this.config()?.schema?.services?.enabled) steps.push('SERVICES');
    steps.push('DOCS', 'REVIEW');
    return steps;
  }

  async nextStep() {
    const steps = this.getFilteredSteps();
    const currentIndex = steps.indexOf(this.currentStep());
    this.isSubmitting.set(true);
    let success = false;

    try {
      switch (this.currentStep()) {
        case 'GUARDIAN':
          success = await this.handleGuardianStep();
          break;
        case 'STUDENT':
          success = await this.syncPillar('pillar_identity', this.formStore.identity)
            && await this.syncPillar('pillar_schooling', this.formStore.schooling);
          break;
        case 'MEDICAL':
          success = await this.syncPillar('pillar_medical', this.formStore.medical);
          break;
        case 'SERVICES':
          success = await this.handleServicesStep();
          break;
        default:
          success = true;
      }

      if (success && currentIndex < steps.length - 1) {
        const next = steps[currentIndex + 1];
        this.currentStep.set(next);
        this.sessionService.updateStep(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async handleGuardianStep(): Promise<boolean> {
    const bundleId = this.bundle()?.id;

    if (bundleId) {
      // Bundle existant — mise à jour famille uniquement
      await this.enrollmentService.updateFamilyPillar(bundleId, this.formStore.family).toPromise();
      return true;
    }

    // Nouveau bundle — ÉTAPE 1 : créer le bundle
    const createReq: CreateBundleRequest = {
      tenantId: this.tenantContext.activeTenant()?.id ?? '',
      family: this.formStore.family
    };

    const bundle = await this.enrollmentService.createBundle(createReq).toPromise();
    if (!bundle?.id) return false;

    this.bundle.set(bundle);
    this.sessionService.saveSession(bundle.id, bundle.accessCode, this.formStore.family.primaryGuardian.firstName, 'STUDENT');

    // ÉTAPE 2 : ajouter le premier enfant
    const addChildReq: AddChildRequest = {
      firstName: this.formStore.identity.firstName || 'Candidat',
      lastName: this.formStore.identity.lastName || this.formStore.family.primaryGuardian.lastName,
      gender: this.formStore.identity.gender,
      type: this.admissionType(),
      academicYearId: this.targetYearId() ?? 'current',
      levelId: this.formStore.schooling.levelId || 'TEMP',
      cycleType: this.formStore.schooling.cycleType as any
    };

    const child = await this.enrollmentService.addChild(bundle.id, addChildReq).toPromise();
    if (!child?.id) return false;

    this.admission.set(child);
    return true;
  }

  private async syncPillar(pillarKey: string, data: any): Promise<boolean> {
    const admissionId = this.admission()?.id;
    if (!admissionId) {
      this.notificationService.error('ID Admission manquant. Veuillez recommencer.');
      return false;
    }
    try {
      await this.enrollmentService.updateChildPillar(admissionId, pillarKey, data).toPromise();
      return true;
    } catch {
      return false;
    }
  }

  private async handleServicesStep(): Promise<boolean> {
    const admissionId = this.admission()?.id;
    if (!admissionId) return false;
    if (!this.formStore.services.length) return true;
    try {
      await this.enrollmentService.subscribeServices(admissionId, this.formStore.services).toPromise();
      return true;
    } catch {
      return false;
    }
  }

  prevStep() {
    const steps = this.getFilteredSteps();
    const idx = steps.indexOf(this.currentStep());
    if (idx > 0) this.currentStep.set(steps[idx - 1]);
  }

  onVaultFileSelected(data: { code: string; event: any }) {
    const file: File = data.event.target.files[0];
    const admissionId = this.admission()?.id;
    if (!file || !admissionId) return;

    this.uploadingDocCode.set(data.code);
    this.documentService.getUploadTicket({ fileName: file.name, contentType: file.type, serviceOrigin: 'enrollment' }).pipe(
      switchMap(ticket => this.documentService.uploadFileDirectly(ticket.uploadUrl, file).pipe(
        switchMap(() => this.enrollmentService.uploadDocument(admissionId, data.code, ticket.fileId))
      )),
      finalize(() => this.uploadingDocCode.set(null))
    ).subscribe({
      next: () => {
        // Rafraîchir les documents de l'admission depuis le bundle en session
        const session = this.sessionService.getSession();
        if (session) {
          this.enrollmentService.getBundle(session.bundleId, session.accessCode).subscribe(bundle => {
            this.bundle.set(bundle);
            const adm = bundle.admissions.find(a => a.id === admissionId);
            if (adm) this.admission.set(adm);
          });
        }
      }
    });
  }

  submitFinal() {
    const bundleId = this.bundle()?.id;
    if (!bundleId) return;

    this.isSubmitting.set(true);
    this.enrollmentService.submitBundle(bundleId).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe(bundle => {
      this.sessionService.clearSession();
      this.router.navigate(['/enrollment/tracker', bundle.reference], {
        queryParams: { accessCode: bundle.accessCode }
      });
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
