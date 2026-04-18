import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArrowLeft, ArrowRight, CheckCircle, FileText, GraduationCap,
  HeartPulse, LayoutGrid, Lock, LucideAngularModule, RefreshCw, User, Users
} from 'lucide-angular';
import { finalize, forkJoin, switchMap } from 'rxjs';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { DocumentEngineService } from '../../../../core/services/document-engine.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { NotificationService } from '../../../../shared/services/notification.service';

import { Admission } from '../../../../core/models/enrollment/entities';
import {
  AdmissionBundleResponse,
  AvailableYearSummary,
  DefaultConfigResponse,
  LevelConfigResponse,
  ServiceSubscriptionRequest,
} from '../../../../core/models/enrollment/dtos';

import { StepFamilyComponent } from './components/step-family/step-family.component';
import { StepIdentityComponent } from './components/step-identity/step-identity.component';
import { StepMedicalComponent } from './components/step-medical/step-medical.component';
import { StepServicesComponent } from './components/step-services/step-services.component';
import { StepVaultComponent } from './components/step-vault/step-vault.component';
import { StepReviewComponent } from './components/step-review/step-review.component';

export type StepperStep = 'GUARDIAN' | 'STUDENT' | 'MEDICAL' | 'SERVICES' | 'DOCS' | 'REVIEW';

const STEP_LABELS: Record<StepperStep, string> = {
  GUARDIAN: 'Famille', STUDENT: 'Élève', MEDICAL: 'Santé',
  SERVICES: 'Services', DOCS: 'Documents', REVIEW: 'Validation'
};

@Component({
  selector: 'app-public-form-stepper',
  standalone: true,
  imports: [
    CommonModule, LucideAngularModule,
    StepFamilyComponent, StepIdentityComponent, StepMedicalComponent,
    StepServicesComponent, StepVaultComponent, StepReviewComponent
  ],
  templateUrl: './public-form-stepper.component.html',
  styleUrls: ['./public-form-stepper.component.scss']
})
export class PublicFormStepperComponent implements OnInit {
  private enrollment = inject(EnrollmentPublicService);
  private docEngine = inject(DocumentEngineService);
  private session = inject(AdmissionSessionService);
  private academic = inject(AcademicService);
  private notify = inject(NotificationService);
  tenantCtx = inject(TenantContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ── État ─────────────────────────────────────────────────────────────────
  step = signal<StepperStep>('GUARDIAN');
  loading = signal(false);
  submitting = signal(false);
  uploadingDoc = signal<string | null>(null);
  portalClosed = signal(false);

  // ── Config ────────────────────────────────────────────────────────────────
  config = signal<DefaultConfigResponse | null>(null);
  levelConfig = signal<LevelConfigResponse | null>(null);
  levels = signal<any[]>([]);
  availableYears = signal<AvailableYearSummary[]>([]);
  admissionType = signal<'NEW_ENROLLMENT' | 'RE_ENROLLMENT'>('NEW_ENROLLMENT');

  // ── Domaine ───────────────────────────────────────────────────────────────
  bundle = signal<AdmissionBundleResponse | null>(null);
  admission = signal<Admission | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────
  schema = computed(() => this.levelConfig()?.schema ?? this.config()?.schema);

  filteredSteps = computed<StepperStep[]>(() => {
    const base: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL'];
    if (this.config()?.schema?.services?.enabled) base.push('SERVICES');
    base.push('DOCS', 'REVIEW');
    return base;
  });

  progress = computed(() => {
    const list = this.filteredSteps();
    return ((list.indexOf(this.step()) + 1) / list.length) * 100;
  });

  bundleRef = computed(() => this.bundle()?.reference ?? '');
  accessCode = computed(() => this.bundle()?.accessCode ?? '');
  levelName = computed(() => this.levels().find(l => l.id === this.store.schooling.levelId)?.name ?? '');
  selectedYearLabel = computed(() => this.availableYears().find(y => y.id === this.store.schooling.academicYearId)?.label ?? '');

  // ── Store de formulaire (source de vérité UI) ─────────────────────────────
  store = {
    family: {
      primaryGuardian: {
        firstName: '', lastName: '', email: '', phone: '',
        relation: 'FATHER', financialResponsible: true,
        customFields: {} as Record<string, any>
      },
      customFields: {} as Record<string, any>
    },
    identity: {
      firstName: '', lastName: '',
      gender: 'MALE' as 'MALE' | 'FEMALE',
      birthDate: '', birthPlace: '',
      customFields: {} as Record<string, any>
    },
    schooling: {
      academicYearId: '', levelId: '',
      cycleType: undefined as string | undefined,
      filiereId: null as string | null,
      customFields: {} as Record<string, any>
    },
    medical: { customFields: {} as Record<string, any> },
    services: [] as ServiceSubscriptionRequest[]
  };

  consent = { checked: false };

  // ── Init ──────────────────────────────────────────────────────────────────
  ngOnInit() {
    const p = this.route.snapshot.queryParamMap;
    const yearFromParam = p.get('yearId');
    if (yearFromParam) this.store.schooling.academicYearId = yearFromParam;
    this.admissionType.set((p.get('type') as any) ?? 'NEW_ENROLLMENT');
    this.loadConfig();
  }

  private loadConfig() {
    this.loading.set(true);
    forkJoin({
      config: this.enrollment.getDefaultConfig(),
      levels: this.academic.getLevels(),
      summary: this.enrollment.getPortalSummary()
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ config, levels, summary }) => {
        this.config.set(config);
        this.levels.set(levels);
        if (!config.portalActive) { this.portalClosed.set(true); return; }

        const years = summary.availableYears ?? [];
        this.availableYears.set(years);

        // Auto-sélectionner l'année si pas déjà choisie (query param ou session)
        if (!this.store.schooling.academicYearId) {
          const active = years.find(y => y.active) ?? years[0];
          if (active) this.store.schooling.academicYearId = active.id;
        }

        this.restoreSession();
      }
    });
  }

  private restoreSession() {
    const s = this.session.getSession();
    if (!s) return;

    this.loading.set(true);
    this.enrollment.getBundle(s.bundleId, s.accessCode).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: bundle => {
        this.bundle.set(bundle);
        const adm = bundle.admissions?.[0] ?? null;
        this.admission.set(adm);
        if (adm) {
          this.syncStore(bundle, adm);
          if (adm.schooling?.levelId) {
            this.enrollment.getLevelConfig(adm.schooling.levelId).subscribe(cfg => this.levelConfig.set(cfg));
          }
        }
        // Si bundle OK mais pas encore d'admission → repositionner à STUDENT
        const saved = (s.currentStep as StepperStep) ?? 'STUDENT';
        this.step.set(!adm && saved !== 'GUARDIAN' ? 'STUDENT' : saved);
      },
      error: () => this.session.clearSession()
    });
  }

  private syncStore(bundle: AdmissionBundleResponse, adm: Admission) {
    const pg = bundle.family.primaryGuardian;
    this.store.family = {
      primaryGuardian: { ...pg, email: pg.email ?? '', customFields: pg.customFields ?? {} },
      customFields: bundle.family.customFields ?? {}
    };
    this.store.identity = { ...adm.identity, customFields: adm.identity.customFields ?? {} };
    this.store.schooling = {
      ...adm.schooling,
      cycleType: adm.schooling.cycleType ?? undefined,
      filiereId: adm.schooling.filiereId ?? null,
      customFields: adm.schooling.customFields ?? {}
    };
    this.store.medical = { customFields: adm.medical?.customFields ?? {} };
  }

  // ── Niveau ────────────────────────────────────────────────────────────────
  onLevelChange(levelId: string) {
    this.store.schooling.levelId = levelId;
    const level = this.levels().find(l => l.id === levelId);
    if (level?.cycleType) this.store.schooling.cycleType = level.cycleType;
    if (levelId) this.enrollment.getLevelConfig(levelId).subscribe(cfg => this.levelConfig.set(cfg));
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  async next() {
    this.submitting.set(true);
    try {
      const ok = await this.runCurrentStep();
      if (!ok) return;
      const list = this.filteredSteps();
      const idx = list.indexOf(this.step());
      if (idx < list.length - 1) {
        const next = list[idx + 1];
        this.step.set(next);
        this.session.updateStep(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      this.submitting.set(false);
    }
  }

  prev() {
    const list = this.filteredSteps();
    const idx = list.indexOf(this.step());
    if (idx > 0) this.step.set(list[idx - 1]);
  }

  // ── Logique par étape ─────────────────────────────────────────────────────
  private async runCurrentStep(): Promise<boolean> {
    switch (this.step()) {
      case 'GUARDIAN': return this.saveGuardian();
      case 'STUDENT':  return this.saveStudent();
      case 'MEDICAL':  return this.savePillar('pillar_medical', this.store.medical);
      case 'SERVICES': return this.saveServices();
      default:         return true;
    }
  }

  private async saveGuardian(): Promise<boolean> {
    const tenantId = this.tenantCtx.activeTenant()?.id;
    if (!tenantId) { this.notify.error('Contexte école non chargé. Veuillez rafraîchir la page.'); return false; }

    const bundleId = this.bundle()?.id;
    const familyPayload = this.buildFamilyPayload();

    if (bundleId) {
      await this.enrollment.updateFamilyPillar(bundleId, familyPayload).toPromise();
      return true;
    }

    const bundle = await this.enrollment.createBundle({ tenantId, family: familyPayload }).toPromise();
    if (!bundle?.id) return false;
    this.bundle.set(bundle);
    this.session.saveSession(bundle.id, bundle.accessCode, this.store.family.primaryGuardian.firstName, 'STUDENT');
    return true;
  }

  /** Nettoie le payload famille avant envoi : supprime les chaînes vides sur les champs optionnels. */
  private buildFamilyPayload() {
    const pg = { ...this.store.family.primaryGuardian };
    if (!pg.email?.trim()) delete (pg as any).email;
    return { ...this.store.family, primaryGuardian: pg };
  }

  private async saveStudent(): Promise<boolean> {
    if (!this.store.schooling.academicYearId) {
      this.notify.error('Veuillez sélectionner une année scolaire.');
      return false;
    }
    if (!this.store.schooling.levelId) {
      this.notify.error('Veuillez sélectionner un niveau scolaire.');
      return false;
    }

    // Premier passage : créer l'admission avec les données réelles
    if (!this.admission()) {
      const bundleId = this.bundle()?.id;
      if (!bundleId) { this.notify.error('Dossier familial manquant.'); return false; }

      const child = await this.enrollment.addChild(bundleId, {
        firstName: this.store.identity.firstName || this.store.family.primaryGuardian.lastName,
        lastName: this.store.identity.lastName || this.store.family.primaryGuardian.lastName,
        gender: this.store.identity.gender,
        type: this.admissionType(),
        academicYearId: this.store.schooling.academicYearId,
        levelId: this.store.schooling.levelId,
        cycleType: this.store.schooling.cycleType as any
      }).toPromise();

      if (!child?.id) return false;
      this.admission.set(child);
    }

    // Toujours mettre à jour les piliers avec les données complètes
    return (
      await this.savePillar('pillar_identity', this.store.identity) &&
      await this.savePillar('pillar_schooling', this.store.schooling)
    );
  }

  private async savePillar(key: string, data: any): Promise<boolean> {
    const admissionId = this.admission()?.id;
    if (!admissionId) { this.notify.error('ID Admission manquant.'); return false; }
    try {
      await this.enrollment.updateChildPillar(admissionId, key, data).toPromise();
      return true;
    } catch { return false; }
  }

  private async saveServices(): Promise<boolean> {
    const admissionId = this.admission()?.id;
    if (!admissionId) return false;
    if (!this.store.services.length) return true;
    try {
      await this.enrollment.subscribeServices(admissionId, this.store.services).toPromise();
      return true;
    } catch { return false; }
  }

  // ── Upload document ───────────────────────────────────────────────────────
  onDocUpload(data: { code: string; file: File }) {
    const admissionId = this.admission()?.id;
    if (!admissionId) return;

    this.uploadingDoc.set(data.code);
    this.docEngine.getUploadTicket({ fileName: data.file.name, contentType: data.file.type, serviceOrigin: 'enrollment' }).pipe(
      switchMap(ticket =>
        this.docEngine.uploadFileDirectly(ticket.uploadUrl, data.file).pipe(
          switchMap(() => this.enrollment.uploadDocument(admissionId, data.code, ticket.fileId))
        )
      ),
      finalize(() => this.uploadingDoc.set(null))
    ).subscribe({ next: () => this.refreshBundle() });
  }

  private refreshBundle() {
    const s = this.session.getSession();
    if (!s) return;
    this.enrollment.getBundle(s.bundleId, s.accessCode).subscribe(bundle => {
      this.bundle.set(bundle);
      const adm = bundle.admissions.find(a => a.id === this.admission()?.id);
      if (adm) this.admission.set(adm);
    });
  }

  // ── Soumission finale ─────────────────────────────────────────────────────
  submit() {
    const bundleId = this.bundle()?.id;
    if (!bundleId || !this.consent.checked) return;

    this.submitting.set(true);
    this.enrollment.submitBundle(bundleId).pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe(bundle => {
      this.session.clearSession();
      this.router.navigate(['/enrollment/tracker', bundle.reference], {
        queryParams: { accessCode: bundle.accessCode }
      });
    });
  }

  // ── Helpers vue ───────────────────────────────────────────────────────────
  isStepDone(index: number): boolean {
    return index < this.filteredSteps().indexOf(this.step());
  }

  stepLabel(s: StepperStep): string { return STEP_LABELS[s]; }

  stepIcon(s: StepperStep): any {
    return { GUARDIAN: Users, STUDENT: User, MEDICAL: HeartPulse, SERVICES: LayoutGrid, DOCS: FileText, REVIEW: CheckCircle }[s];
  }

  // ── Icônes ────────────────────────────────────────────────────────────────
  readonly GraduationCap = GraduationCap;
  readonly Lock = Lock;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly RefreshCw = RefreshCw;
}
