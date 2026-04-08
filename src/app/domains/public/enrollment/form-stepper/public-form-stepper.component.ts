import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bus,
  CheckCircle,
  ChefHat,
  ClipboardList,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Info,
  LucideAngularModule,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Users,
  X,
  HeartPulse,
  School
} from 'lucide-angular';
import {catchError, finalize, forkJoin, Observable, of, switchMap, tap, map} from 'rxjs';

import {
  EnrollmentPublicService
} from '../../../../core/services/enrollment-public.service';
import {DocumentEngineService} from '../../../../core/services/document-engine.service';
import {AdmissionSessionService} from '../../../../core/services/admission-session.service';
import {AcademicService} from '../../../../core/services/academic.service';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {Cycle, Filiere, Level} from '../../../../core/models/academic.model';
import {Admission, CreateBundleRequest, FieldConfig, EffectiveConfigResponse, PublicPortalSummary} from '../../../../core/models/enrollment.model';
import {Router} from '@angular/router';

import {NotificationService} from '../../../../shared/services/notification.service';
import {MatCheckbox} from '@angular/material/checkbox';

export type StepperStep = 'GUARDIAN' | 'STUDENT' | 'MEDICAL' | 'DOCS' | 'REVIEW';

@Component({
  selector: 'app-public-form-stepper',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, MatCheckbox],
  templateUrl: './public-form-stepper.component.html',
  styleUrls: ['./public-form-stepper.component.scss']
})
export class PublicFormStepperComponent implements OnInit {
  private enrollmentService = inject(EnrollmentPublicService);
  private documentService = inject(DocumentEngineService);
  private sessionService = inject(AdmissionSessionService);
  private academicService = inject(AcademicService);
  public tenantContext = inject(TenantContextService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // --- ÉTATS ---
  summary = signal<PublicPortalSummary | null>(null);
  effectiveConfig = signal<EffectiveConfigResponse | null>(null);

  currentStep = signal<StepperStep>('GUARDIAN');
  currentAdmissionId = signal<string | null>(null);
  application = signal<Admission | null>(null);

  isSubmitting = signal(false);
  isLoading = signal(false);
  uploadingDocCode = signal<string | null>(null);
  isPortalClosed = signal(false);
  consentChecked = signal(false);

  // --- RÉFÉRENTIELS ---
  availableLevels = signal<Level[]>([]);
  availableFilieres = signal<Filiere[]>([]);

  // --- DONNÉES FORMULAIRE (V4) ---
  formData = signal({
    family: {
      primaryGuardian: {
        firstName: '', lastName: '', email: '', phone: '',
        relation: 'FATHER' as any, isFinancialResponsible: true,
        profession: ''
      },
      homeAddress: ''
    },
    identity: {
      firstName: '', lastName: '', gender: 'MALE' as any,
      birthDate: '', birthPlace: '', nationality: 'Sénégalaise'
    },
    medical: {
      bloodGroup: '', criticalAllergies: '', emergencyContactName: '', emergencyContactPhone: ''
    },
    schooling: {
      requestedLevelId: '',
      filiereId: null as string | null,
      previousSchool: ''
    },
    customFields: {} as Record<string, Record<string, any>>
  });

  progress = computed(() => {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL', 'DOCS', 'REVIEW'];
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  ngOnInit() {
    this.loadInitialData();
    this.checkExistingSession();
  }

  private loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      levels: this.academicService.getLevels(),
      filieres: this.academicService.getFilieres(),
      summary: this.enrollmentService.getPortalSummary()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({levels, filieres, summary}) => {
        this.availableLevels.set(levels);
        this.availableFilieres.set(filieres);
        this.summary.set(summary);
        if (summary && !summary.portalActive) this.isPortalClosed.set(true);
      }
    });
  }

  private checkExistingSession() {
    const session = this.sessionService.getSession();
    if (session) {
      this.isSubmitting.set(true);
      this.enrollmentService.trackApplication(session.reference, session.accessCode).pipe(
        switchMap(app => {
          if (app && app.status === 'DRAFT') {
            this.application.set(app);
            this.currentAdmissionId.set(app.id);
            this.resumeFormData(app);
            if (app.schooling?.levelId) return this.enrollmentService.getEffectiveConfig(app.schooling.levelId);
          }
          return of(null);
        }),
        tap(config => {
          if (config) this.effectiveConfig.set(config);
          this.currentStep.set(session.currentStep as StepperStep || 'STUDENT');
        }),
        catchError(() => {
          this.sessionService.clearSession();
          return of(null);
        }),
        finalize(() => this.isSubmitting.set(false))
      ).subscribe();
    }
  }

  private resumeFormData(app: Admission) {
    this.formData.set({
      family: {
        primaryGuardian: {
          firstName: app.family?.primaryGuardian?.firstName || '',
          lastName: app.family?.primaryGuardian?.lastName || '',
          email: app.family?.primaryGuardian?.email || '',
          phone: app.family?.primaryGuardian?.phone || '',
          relation: app.family?.primaryGuardian?.relation || 'FATHER',
          isFinancialResponsible: app.family?.primaryGuardian?.isFinancialResponsible ?? true,
          profession: app.family?.primaryGuardian?.profession || ''
        },
        homeAddress: app.family?.homeAddress || ''
      },
      identity: {
        firstName: app.identity?.firstName || '',
        lastName: app.identity?.lastName || '',
        gender: app.identity?.gender || 'MALE',
        birthDate: app.identity?.birthDate || '',
        birthPlace: app.identity?.birthPlace || '',
        nationality: app.identity?.nationality || 'Sénégalaise'
      },
      medical: {
        bloodGroup: app.medical?.bloodGroup || '',
        criticalAllergies: app.medical?.criticalAllergies || '',
        emergencyContactName: app.medical?.emergencyContactName || '',
        emergencyContactPhone: app.medical?.emergencyContactPhone || ''
      },
      schooling: {
        requestedLevelId: app.schooling?.levelId || '',
        filiereId: app.schooling?.filiereId || null,
        previousSchool: app.schooling?.previousSchool || ''
      },
      customFields: {
        pillar_identity: app.identity?.customFields || {},
        pillar_medical: app.medical?.customFields || {},
        pillar_family: app.family?.customFields || {},
        pillar_schooling: app.schooling?.customFields || {}
      }
    });
  }

  nextStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    this.isSubmitting.set(true);
    let operation$: Observable<any> = of(true);

    switch (this.currentStep()) {
      case 'GUARDIAN':
        operation$ = this.currentAdmissionId() ? this.savePillar('family', 'pillar_family') : this.initializeBundle();
        break;
      case 'STUDENT':
        operation$ = this.savePillar('identity', 'pillar_identity');
        break;
      case 'MEDICAL':
        operation$ = this.savePillar('medical', 'pillar_medical');
        break;
    }

    operation$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (success) => {
        if (success && currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1];
          this.currentStep.set(nextStep);
          this.sessionService.updateStep(nextStep);
          window.scrollTo(0, 0);
        }
      }
    });
  }

  private initializeBundle() {
    const tenantId = this.tenantContext.activeTenant()?.id || 'default';
    const data = this.formData();

    return this.academicService.getCurrentYear().pipe(
      switchMap(year => {
        const payload: CreateBundleRequest = {
          tenantId,
          family: {
            primaryGuardian: data.family.primaryGuardian,
            homeAddress: data.family.homeAddress,
            customFields: data.customFields['pillar_family']
          },
          children: [{
            firstName: data.identity.firstName || 'Enfant 1',
            lastName: data.identity.lastName || data.family.primaryGuardian.lastName || '',
            gender: data.identity.gender,
            academicYearId: year.id,
            levelId: data.schooling.requestedLevelId || 'TEMP_ID'
          }]
        };
        return this.enrollmentService.createApplication(payload);
      }),
      tap(bundle => {
        if (bundle.admissions.length > 0) {
          const firstChild = bundle.admissions[0];
          this.currentAdmissionId.set(firstChild.id);
          this.application.set(firstChild);
          this.sessionService.saveSession(firstChild.reference, bundle.accessCode, firstChild.identity.firstName, 'STUDENT');
        }
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private savePillar(pillar: 'identity' | 'medical' | 'schooling' | 'family', configKey: string) {
    const id = this.currentAdmissionId();
    if (!id) return of(false);
    
    const pillarData = {
      ...(this.formData() as any)[pillar],
      customFields: this.formData().customFields[configKey]
    };

    return this.enrollmentService.updatePillar(id, pillar, pillarData).pipe(
      switchMap(app => {
        this.application.set(app);
        if (pillar === 'schooling' && app.schooling.levelId) {
          return this.enrollmentService.getEffectiveConfig(app.schooling.levelId);
        }
        return of(null);
      }),
      tap(config => { if (config) this.effectiveConfig.set(config); }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  prevStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'MEDICAL', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
    }
  }

  getPillarConfig(key: string) {
    return this.effectiveConfig()?.pillars[key] || null;
  }

  /** Recherche un champ système par son nom dans un pilier */
  getSystemField(pillarKey: string, fieldName: string): FieldConfig | null {
    const pillar = this.getPillarConfig(pillarKey);
    return pillar?.systemFields.find((f: FieldConfig) => f.name === fieldName) || null;
  }

  onFileSelected(docCode: string, event: any) {
    const file = event.target.files[0];
    const id = this.currentAdmissionId();
    if (!file || !id) return;

    this.uploadingDocCode.set(docCode);
    this.documentService.getUploadTicket({ fileName: file.name, contentType: file.type, serviceOrigin: 'enrollment' }).pipe(
      switchMap(ticket => this.documentService.uploadFileDirectly(ticket.uploadUrl, file).pipe(map(() => ticket))),
      switchMap(ticket => this.enrollmentService.uploadDocument(id, docCode, ticket.fileId)),
      finalize(() => this.uploadingDocCode.set(null))
    ).subscribe(app => this.application.set(app));
  }

  submitFinal() {
    const id = this.currentAdmissionId();
    const app = this.application();
    if (!id || !app) return;
    this.isSubmitting.set(true);
    this.enrollmentService.submitApplication(id).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe(res => {
      this.sessionService.clearSession();
      this.router.navigate(['/enrollment/tracker', res.reference], { queryParams: { accessCode: app.bundleId } });
    });
  }

  readonly GraduationCap = GraduationCap;
  readonly User = User;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly Sparkles = Sparkles;
  readonly CheckCircle = CheckCircle;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Upload = Upload;
  readonly X = X;
  readonly RefreshCw = RefreshCw;
  readonly Eye = Eye;
  readonly Info = Info;
  readonly ShieldCheck = ShieldCheck;
  readonly MessageSquare = MessageSquare;
  readonly ChefHat = ChefHat;
  readonly Bus = Bus;
  readonly ClipboardList = ClipboardList;
  readonly AlertTriangle = AlertTriangle;
  readonly HeartPulse = HeartPulse;
}
