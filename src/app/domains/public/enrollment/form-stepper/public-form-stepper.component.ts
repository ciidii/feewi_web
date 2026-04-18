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
import { StepHubComponent } from './components/step-hub/step-hub.component';

export type GlobalPhase = 'GUARDIAN' | 'HUB' | 'REVIEW';
export type ChildPhase  = 'STUDENT'  | 'MEDICAL' | 'SERVICES' | 'DOCS';

const CHILD_STEPS: ChildPhase[] = ['STUDENT', 'MEDICAL', 'SERVICES', 'DOCS'];

@Component({
  selector: 'app-public-form-stepper',
  standalone: true,
  imports: [
    CommonModule, LucideAngularModule,
    StepFamilyComponent, StepIdentityComponent, StepMedicalComponent,
    StepServicesComponent, StepVaultComponent, StepReviewComponent,
    StepHubComponent
  ],
  templateUrl: './public-form-stepper.component.html',
  styleUrls: ['./public-form-stepper.component.scss']
})
export class PublicFormStepperComponent implements OnInit {
  private enrollment = inject(EnrollmentPublicService);
  private docEngine   = inject(DocumentEngineService);
  private session     = inject(AdmissionSessionService);
  private academic    = inject(AcademicService);
  private notify      = inject(NotificationService);
  tenantCtx           = inject(TenantContextService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);

  // ── Phases ────────────────────────────────────────────────────────────────
  globalPhase = signal<GlobalPhase>('GUARDIAN');
  childPhase  = signal<ChildPhase | null>(null);

  isChildFlow = computed(() => this.childPhase() !== null);

  // ── État ─────────────────────────────────────────────────────────────────
  loading      = signal(false);
  submitting   = signal(false);
  uploadingDoc = signal<string | null>(null);
  portalClosed = signal(false);

  // ── Config ────────────────────────────────────────────────────────────────
  config         = signal<DefaultConfigResponse | null>(null);
  levelConfig    = signal<LevelConfigResponse | null>(null);
  levels         = signal<any[]>([]);
  availableYears = signal<AvailableYearSummary[]>([]);
  admissionType  = signal<'NEW_ENROLLMENT' | 'RE_ENROLLMENT'>('NEW_ENROLLMENT');

  // ── Domaine ───────────────────────────────────────────────────────────────
  bundle          = signal<AdmissionBundleResponse | null>(null);
  activeAdmission = signal<Admission | null>(null); // enfant en cours d'édition

  // ── Computed ─────────────────────────────────────────────────────────────
  schema = computed(() => this.levelConfig()?.schema ?? this.config()?.schema);

  admissions = computed(() => this.bundle()?.admissions ?? []);

  childSteps = computed<ChildPhase[]>(() => {
    const base: ChildPhase[] = ['STUDENT', 'MEDICAL'];
    if (this.config()?.schema?.services?.enabled) base.push('SERVICES');
    base.push('DOCS');
    return base;
  });

  childProgress = computed(() => {
    const list = this.childSteps();
    const idx  = list.indexOf(this.childPhase()!);
    return idx < 0 ? 0 : ((idx + 1) / list.length) * 100;
  });

  bundleRef  = computed(() => this.bundle()?.reference ?? '');
  accessCode = computed(() => this.bundle()?.accessCode ?? '');
  levelName  = computed(() => this.levels().find(l => l.id === this.store.schooling.levelId)?.name ?? '');
  selectedYearLabel = computed(() => this.availableYears().find(y => y.id === this.store.schooling.academicYearId)?.label ?? '');

  isFirstChild = computed(() => this.admissions().length === 0 && !this.activeAdmission());

  // ── Store enfant (réinitialisé à chaque nouvel enfant) ───────────────────
  store = {
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
    medical:  { customFields: {} as Record<string, any> },
    services: [] as ServiceSubscriptionRequest[]
  };

  // Store famille — unique, non réinitialisé
  familyStore = {
    primaryGuardian: {
      firstName: '', lastName: '', email: '', phone: '',
      relation: 'FATHER', financialResponsible: true,
      customFields: {} as Record<string, any>
    },
    customFields: {} as Record<string, any>
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
      config:  this.enrollment.getDefaultConfig(),
      levels:  this.academic.getLevels(),
      summary: this.enrollment.getPortalSummary()
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ config, levels, summary }) => {
        this.config.set(config);
        this.levels.set(levels);
        if (!config.portalActive) { this.portalClosed.set(true); return; }

        const years = summary.availableYears ?? [];
        this.availableYears.set(years);
        if (!this.store.schooling.academicYearId) {
          const active = years.find(y => y.active) ?? years[0];
          if (active) this.store.schooling.academicYearId = active.id;
        }

        this.restoreSession();
      }
    });
  }

  // ── Restauration session ──────────────────────────────────────────────────
  private restoreSession() {
    const s = this.session.getSession();
    if (!s) return;

    this.loading.set(true);
    this.enrollment.getBundle(s.bundleId, s.accessCode).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: bundle => {
        this.bundle.set(bundle);
        this.syncFamilyStore(bundle);

        const globalPhase = (s.currentGlobalPhase as GlobalPhase) ?? 'HUB';
        this.globalPhase.set(globalPhase);

        if (s.currentAdmissionId && s.currentChildPhase) {
          const adm = bundle.admissions.find(a => a.id === s.currentAdmissionId);
          if (adm) {
            this.openChildEditor(adm);
            this.childPhase.set(s.currentChildPhase as ChildPhase);
          } else {
            this.globalPhase.set('HUB');
          }
        }
      },
      error: () => this.session.clearSession()
    });
  }

  private syncFamilyStore(bundle: AdmissionBundleResponse) {
    const pg = bundle.family.primaryGuardian;
    this.familyStore = {
      primaryGuardian: { ...pg, email: pg.email ?? '', customFields: pg.customFields ?? {} },
      customFields: bundle.family.customFields ?? {}
    };
  }

  private loadChildIntoStore(adm: Admission) {
    this.store.identity = { ...adm.identity, customFields: adm.identity.customFields ?? {} };
    this.store.schooling = {
      ...adm.schooling,
      academicYearId: adm.schooling.academicYearId || this.store.schooling.academicYearId,
      cycleType: adm.schooling.cycleType ?? undefined,
      filiereId: adm.schooling.filiereId ?? null,
      customFields: adm.schooling.customFields ?? {}
    };
    this.store.medical  = { customFields: adm.medical?.customFields ?? {} };
    this.store.services = [];
    if (adm.schooling?.levelId) {
      this.enrollment.getLevelConfig(adm.schooling.levelId).subscribe(cfg => this.levelConfig.set(cfg));
    }
  }

  private resetChildStore() {
    const yearId = this.store.schooling.academicYearId;
    this.store.identity  = { firstName: '', lastName: '', gender: 'MALE', birthDate: '', birthPlace: '', customFields: {} };
    this.store.schooling = { academicYearId: yearId, levelId: '', cycleType: undefined, filiereId: null, customFields: {} };
    this.store.medical   = { customFields: {} };
    this.store.services  = [];
    this.levelConfig.set(null);
  }

  // ── Niveau ────────────────────────────────────────────────────────────────
  onLevelChange(levelId: string) {
    this.store.schooling.levelId = levelId;
    const level = this.levels().find(l => l.id === levelId);
    if (level?.cycleType) this.store.schooling.cycleType = level.cycleType;
    if (levelId) this.enrollment.getLevelConfig(levelId).subscribe(cfg => this.levelConfig.set(cfg));
  }

  // ── Gestion des enfants ───────────────────────────────────────────────────
  openChildEditor(adm: Admission) {
    this.activeAdmission.set(adm);
    this.loadChildIntoStore(adm);
    this.childPhase.set('STUDENT');
    this.savePhase('HUB', 'STUDENT', adm.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addNewChild() {
    this.activeAdmission.set(null);
    this.resetChildStore();
    this.childPhase.set('STUDENT');
    this.savePhase('HUB', 'STUDENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  exitChildEditor() {
    this.activeAdmission.set(null);
    this.childPhase.set(null);
    this.refreshBundle();
    this.savePhase('HUB');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToReview() {
    this.globalPhase.set('REVIEW');
    this.childPhase.set(null);
    this.savePhase('REVIEW');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Navigation enfant ─────────────────────────────────────────────────────
  async nextChildStep() {
    this.submitting.set(true);
    try {
      const ok = await this.runChildStep();
      if (!ok) return;

      const list = this.childSteps();
      const idx  = list.indexOf(this.childPhase()!);

      if (idx < list.length - 1) {
        const next = list[idx + 1];
        this.childPhase.set(next);
        this.savePhase('HUB', next, this.activeAdmission()?.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Fin du flux enfant → retour au HUB
        this.exitChildEditor();
      }
    } finally {
      this.submitting.set(false);
    }
  }

  prevChildStep() {
    const list = this.childSteps();
    const idx  = list.indexOf(this.childPhase()!);
    if (idx > 0) {
      this.childPhase.set(list[idx - 1]);
    } else {
      // Premier step → retour au HUB
      this.exitChildEditor();
    }
  }

  // ── Navigation globale (GUARDIAN) ─────────────────────────────────────────
  async nextGlobalStep() {
    this.submitting.set(true);
    try {
      const ok = await this.saveGuardian();
      if (!ok) return;
      this.globalPhase.set('HUB');
      this.savePhase('HUB');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      this.submitting.set(false);
    }
  }

  // ── Logique par étape ─────────────────────────────────────────────────────
  private async runChildStep(): Promise<boolean> {
    switch (this.childPhase()) {
      case 'STUDENT':  return this.saveStudent();
      case 'MEDICAL':  return this.savePillar('pillar_medical', this.store.medical);
      case 'SERVICES': return this.saveServices();
      default:         return true; // DOCS → géré par upload inline
    }
  }

  private async saveGuardian(): Promise<boolean> {
    const tenantId = this.tenantCtx.activeTenant()?.id;
    if (!tenantId) { this.notify.error('Contexte école non chargé. Veuillez rafraîchir la page.'); return false; }

    const bundleId = this.bundle()?.id;
    const payload  = this.buildFamilyPayload();

    if (bundleId) {
      await this.enrollment.updateFamilyPillar(bundleId, payload).toPromise();
      return true;
    }

    const bundle = await this.enrollment.createBundle({ tenantId, family: payload }).toPromise();
    if (!bundle?.id) return false;
    this.bundle.set(bundle);
    this.session.saveSession(bundle.id, bundle.accessCode, this.familyStore.primaryGuardian.firstName);
    this.savePhase('HUB');
    return true;
  }

  private buildFamilyPayload() {
    const pg = { ...this.familyStore.primaryGuardian };
    if (!pg.email?.trim()) delete (pg as any).email;
    return { ...this.familyStore, primaryGuardian: pg };
  }

  private async saveStudent(): Promise<boolean> {
    if (!this.store.schooling.academicYearId) {
      this.notify.error('Année scolaire manquante.'); return false;
    }
    if (!this.store.schooling.levelId) {
      this.notify.error('Veuillez sélectionner un niveau scolaire.'); return false;
    }

    if (!this.activeAdmission()) {
      const bundleId = this.bundle()?.id;
      if (!bundleId) { this.notify.error('Dossier familial manquant.'); return false; }

      const child = await this.enrollment.addChild(bundleId, {
        firstName:      this.store.identity.firstName || this.familyStore.primaryGuardian.lastName,
        lastName:       this.store.identity.lastName  || this.familyStore.primaryGuardian.lastName,
        gender:         this.store.identity.gender,
        type:           this.admissionType(),
        academicYearId: this.store.schooling.academicYearId,
        levelId:        this.store.schooling.levelId,
        cycleType:      this.store.schooling.cycleType as any
      }).toPromise();

      if (!child?.id) return false;
      this.activeAdmission.set(child);
    }

    return (
      await this.savePillar('pillar_identity', this.store.identity) &&
      await this.savePillar('pillar_schooling', this.store.schooling)
    );
  }

  private async savePillar(key: string, data: any): Promise<boolean> {
    const admissionId = this.activeAdmission()?.id;
    if (!admissionId) { this.notify.error('ID Admission manquant.'); return false; }
    try {
      await this.enrollment.updateChildPillar(admissionId, key, data).toPromise();
      return true;
    } catch { return false; }
  }

  private async saveServices(): Promise<boolean> {
    const admissionId = this.activeAdmission()?.id;
    if (!admissionId) return false;
    if (!this.store.services.length) return true;
    try {
      await this.enrollment.subscribeServices(admissionId, this.store.services).toPromise();
      return true;
    } catch { return false; }
  }

  // ── Upload document ───────────────────────────────────────────────────────
  onDocUpload(data: { code: string; file: File }) {
    const admissionId = this.activeAdmission()?.id;
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
      const adm = bundle.admissions.find(a => a.id === this.activeAdmission()?.id);
      if (adm) this.activeAdmission.set(adm);
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

  // ── Helpers sidebar ───────────────────────────────────────────────────────
  childStepLabel(s: ChildPhase): string {
    return { STUDENT: 'Identité', MEDICAL: 'Santé', SERVICES: 'Services', DOCS: 'Documents' }[s];
  }

  childStepIcon(s: ChildPhase): any {
    return { STUDENT: User, MEDICAL: HeartPulse, SERVICES: LayoutGrid, DOCS: FileText }[s];
  }

  isChildStepDone(s: ChildPhase): boolean {
    const list = this.childSteps();
    return list.indexOf(s) < list.indexOf(this.childPhase()!);
  }

  private savePhase(global: GlobalPhase, child?: string, admissionId?: string) {
    this.session.updatePhase(global, child, admissionId);
  }

  // ── Icônes ────────────────────────────────────────────────────────────────
  readonly GraduationCap = GraduationCap;
  readonly Lock     = Lock;
  readonly ArrowLeft  = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly RefreshCw  = RefreshCw;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
}
