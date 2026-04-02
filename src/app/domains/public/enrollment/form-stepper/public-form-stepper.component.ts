import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule, User, Users, FileText, Sparkles, CheckCircle,
  ArrowLeft, ArrowRight, Upload, X, GraduationCap, RefreshCw, Eye,
  Info, ShieldCheck, MessageSquare, ChefHat, Bus, ClipboardList, AlertTriangle, FileSpreadsheet, FileImage
} from 'lucide-angular';
import { catchError, finalize, forkJoin, map, of, switchMap, tap, Observable } from 'rxjs';

import { EnrollmentPublicService, PublicPortalSummary, EffectiveConfigResponse } from '../../../../core/services/enrollment-public.service';
import { DocumentEngineService } from '../../../../core/services/document-engine.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import {Level, AcademicYear, Filiere, Cycle} from '../../../../core/models/academic.model';
import {
  AdmissionApplication as Application,
  CoreFieldControl,
  CustomFieldConfig,
  Guardian,
  RequiredDocumentConfig
} from '../../../../core/models/enrollment.model';
import { Router } from '@angular/router';

import { NotificationService } from '../../../../shared/services/notification.service';
import { MatCheckbox } from '@angular/material/checkbox';

export type StepperStep = 'GUARDIAN' | 'STUDENT' | 'SPECIFIC' | 'SERVICES' | 'DOCS' | 'REVIEW';

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

  constructor() {
    effect(() => {
      console.group('--- [Stepper Debug Trace] ---');
      console.log('Niveaux chargés:', this.availableLevels().length);
      console.log('Cycles chargés:', this.availableCycles().length);
      console.log('Sélection Actuelle:', this.formData().student.requestedLevelId);
      console.log('État Sélecteur Filière:', this.showFiliereSelector());
      console.groupEnd();
    });
  }

  // --- ÉTATS ---
  summary = signal<PublicPortalSummary | null>(null);
  effectiveConfig = signal<EffectiveConfigResponse | null>(null);

  currentStep = signal<StepperStep>('GUARDIAN');
  currentApplicationId = signal<string | null>(null);
  application = signal<Application | null>(null);

  isSubmitting = signal(false);
  isLoading = signal(false);
  uploadingDocCode = signal<string | null>(null);
  isPortalClosed = signal(false);
  consentChecked = signal(false); // AJOUTÉ : Pour débloquer la soumission finale

  // --- RÉFÉRENTIELS ---
  availableLevels = signal<Level[]>([]);
  availableFilieres = signal<Filiere[]>([]);
  availableCycles = signal<Cycle[]>([]); // AJOUTÉ

  // --- DONNÉES FORMULAIRE ---
  formData = signal({
    primaryGuardian: {
      firstName: '', lastName: '', email: '', phone: '',
      relation: 'FATHER' as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER',
      profession: '', address: ''
    },
    student: {
      firstName: '', lastName: '', birthDate: '', birthPlace: '',
      gender: '' as 'MALE' | 'FEMALE',
      nationality: 'Sénégalaise',
      previousSchool: '',
      requestedLevelId: '',
      filiereId: null as string | null
    },
    specificResponses: {} as Record<string, any>,
    services: {
      canteen: false,
      transport: false
    }
  });

  // --- CALCULS RÉACTIFS (UNIFIED MODEL) ---

  progress = computed(() => {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'SPECIFIC', 'SERVICES', 'DOCS', 'REVIEW'];
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  showFiliereSelector = computed(() => {
    const levelId = this.formData().student.requestedLevelId;
    const levels = this.availableLevels();
    const cycles = this.availableCycles();

    if (!levelId) return false;

    const selectedLevel = levels.find(l => l.id === levelId);
    if (!selectedLevel) return false;

    // --- DEEP DEBUG LOG ---
    // On log l'objet brut pour voir si c'est 'cycleId' ou 'cycle_id' ou 'cycle'
    console.log('[Stepper Debug] Objet Niveau sélectionné:', selectedLevel);
    
    // 1. Tentative par objet imbriqué
    if (selectedLevel.cycle?.cycleCode === 'HIGH_SCHOOL') return true;

    // 2. Tentative par jointure d'ID (attention aux noms de champs)
    const cycleId = (selectedLevel as any).cycleId || (selectedLevel as any).cycle_id;
    const matchedCycle = cycles.find(c => c.id === cycleId);
    
    if (matchedCycle?.cycleCode === 'HIGH_SCHOOL') return true;

    // 3. Fallback de sécurité par le Nom (si la base de données est mal liée)
    const name = selectedLevel.name.toLowerCase();
    const isHighSchoolName = name.includes('seconde') || name.includes('première') || name.includes('terminale') || name.includes('lycée');

    return isHighSchoolName;
  });

  selectedLevelName = computed(() => {
    const levelId = this.formData().student.requestedLevelId;
    return this.availableLevels().find(l => l.id === levelId)?.name || 'Non sélectionné';
  });

  /** Questions Spécifiques Effectives */
  effectiveCustomFields = computed(() => {
    return this.effectiveConfig()?.formSchema?.customFields || [];
  });

  /** Checklist Effective */
  effectiveChecklist = computed(() => {
    return this.effectiveConfig()?.documentChecklist || [];
  });

  /** Instructions contextuelles par étape */
  currentInstruction = computed(() => {
    const instructions = this.effectiveConfig()?.instructions;
    if (!instructions) return null;

    const stepKeyMap: Record<StepperStep, string> = {
      'GUARDIAN': 'step_guardian',
      'STUDENT': 'step_student',
      'SPECIFIC': 'step_specific',
      'SERVICES': 'step_services',
      'DOCS': 'step_docs',
      'REVIEW': 'step_review'
    };

    return instructions[stepKeyMap[this.currentStep()]] || null;
  });

  getCoreControl(key: string): CoreFieldControl {
    return this.effectiveConfig()?.coreFieldOverrides?.[key] || { label: '', hidden: false, mandatory: false };
  }

  isServiceEnabled(code: string): boolean {
    return this.summary()?.enabledServices?.includes(code) || false;
  }

  ngOnInit() {
    this.loadInitialData();
    this.checkExistingSession();
  }

  private loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      levels: this.academicService.getLevels(),
      filieres: this.academicService.getFilieres(),
      cycles: this.academicService.getCycles(), // AJOUTÉ
      summary: this.enrollmentService.getPortalSummary()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ levels, filieres, cycles, summary }) => {
        this.availableLevels.set(levels);
        this.availableFilieres.set(filieres);
        this.availableCycles.set(cycles);
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
            this.currentApplicationId.set(app.id);
            this.resumeFormData(app);
            if (app.levelId) return this.enrollmentService.getEffectiveConfig(app.levelId);
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

  private resumeFormData(app: Application) {
    this.formData.update(f => ({
      ...f,
      primaryGuardian: {
        firstName: app.primaryGuardian?.firstName || '',
        lastName: app.primaryGuardian?.lastName || '',
        email: app.primaryGuardian?.email || '',
        phone: app.primaryGuardian?.phone || '',
        relation: app.primaryGuardian?.relation || 'FATHER',
        profession: (app.primaryGuardian as any)?.profession || '',
        address: (app.primaryGuardian as any)?.address || ''
      },
      student: {
        firstName: app.candidate?.firstName || '',
        lastName: app.candidate?.lastName || '',
        gender: app.candidate?.gender || '' as any,
        birthDate: app.candidate?.birthDate || '',
        birthPlace: app.candidate?.birthPlace || '',
        nationality: app.candidate?.nationality || 'Sénégalaise',
        previousSchool: app.candidate?.previousSchool || '',
        requestedLevelId: app.levelId || '',
        filiereId: app.filiereId || null
      }
    }));
  }

  nextStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'SPECIFIC', 'SERVICES', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    this.isSubmitting.set(true);
    let operation$: Observable<any> = of(true);

    switch(this.currentStep()) {
      case 'GUARDIAN':
        // CHANTIER UX : Si on a déjà un ID, on met à jour. Sinon on initialise.
        operation$ = this.currentApplicationId() ? this.saveGuardianInfo() : this.initializeApplication();
        break;
      case 'STUDENT':
        operation$ = this.saveCandidateInfo();
        break;
      case 'SPECIFIC':
        operation$ = this.saveCustomFields();
        break;
      case 'SERVICES':
        operation$ = this.saveSubscriptions();
        break;
    }

    operation$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (success) => {
        // ON NE PASSE À LA SUITE QUE SI LE SERVEUR A RÉPONDU TRUE
        if (success && currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1];
          this.currentStep.set(nextStep);
          this.sessionService.updateStep(nextStep);
          window.scrollTo(0, 0);
        }
      },
      error: (err) => {
        console.error('[Stepper] Operation failed, staying on step:', currentIndex);
      }
    });
  }

  prevStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'SPECIFIC', 'SERVICES', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      this.currentStep.set(prevStep);
      this.sessionService.updateStep(prevStep);
      window.scrollTo(0, 0);
    }
  }

  // --- ACTIONS DE MISE À JOUR IMMUABLE (UX REACITIVITY) ---

  updateGuardianData(patch: Partial<any>) {
    this.formData.update(prev => ({
      ...prev,
      primaryGuardian: { ...prev.primaryGuardian, ...patch }
    }));
  }

  updateStudentData(patch: Partial<any>) {
    this.formData.update(prev => ({
      ...prev,
      student: { ...prev.student, ...patch }
    }));
  }

  private initializeApplication() {
    const tenantId = this.tenantContext.activeTenant()?.id || 'default';
    const guardianData = this.formData().primaryGuardian;

    return this.academicService.getCurrentYear().pipe(
      switchMap(year => {
        const payload = {
          tenantId,
          type: 'NEW' as const,
          academicYearId: year.id,
          primaryGuardian: {
            firstName: guardianData.firstName,
            lastName: guardianData.lastName,
            email: guardianData.email,
            phone: guardianData.phone,
            relation: guardianData.relation
          }
        };
        return this.enrollmentService.createApplication(payload);
      }),
      // CHANTIER A : Chaînage immédiat avec WRAPPER pour profession/adresse
      switchMap(createdApp => {
        this.currentApplicationId.set(createdApp.id);
        this.application.set(createdApp);

        // HYPOTHÈSE SENIOR : Le backend attend l'objet wrappé pour valider l'entité
        const updatePayload = {
          firstName: guardianData.firstName,
          lastName: guardianData.lastName,
          email: guardianData.email,
          phone: guardianData.phone,
          relation: guardianData.relation,
          profession: guardianData.profession,
          address: guardianData.address
        };

        return this.enrollmentService.updateGuardians(createdApp.id, updatePayload).pipe(
          map(updatedApp => updatedApp || createdApp)
        );
      }),
      tap(res => {
        if (!res) return;
        this.application.set(res);
        this.sessionService.saveSession(res.reference, res.accessCode || '', res.primaryGuardian?.firstName || '', 'STUDENT');
      }),
      map(() => true),
      catchError(err => {
        console.error('[Stepper] Initialization failed:', err);
        return of(false);
      })
    );
  }

  private saveGuardianInfo() {
    const guardianData = this.formData().primaryGuardian;
    const payload = {
      firstName: guardianData.firstName,
      lastName: guardianData.lastName,
      email: guardianData.email,
      phone: guardianData.phone,
      relation: guardianData.relation,
      profession: guardianData.profession,
      address: guardianData.address
    };

    return this.enrollmentService.updateGuardians(this.currentApplicationId()!, payload).pipe(
      tap(app => this.application.set(app)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private saveCandidateInfo() {
    const studentData = this.formData().student;
    const infoPayload = {
      firstName: studentData.firstName, lastName: studentData.lastName,
      gender: studentData.gender, birthDate: studentData.birthDate,
      birthPlace: studentData.birthPlace, nationality: studentData.nationality,
      previousSchool: studentData.previousSchool
    };
    const payload = {
      info: infoPayload,
      levelId: studentData.requestedLevelId,
      filiereId: studentData.filiereId
    };

    return this.enrollmentService.updateCandidate(this.currentApplicationId()!, payload).pipe(
      switchMap(app => {
        const effectiveLevelId = app?.levelId || payload.levelId;
        if (app) this.application.set(app);
        return this.enrollmentService.getEffectiveConfig(effectiveLevelId);
      }),
      tap(config => {
        this.effectiveConfig.set(config);
        this.formData().specificResponses = {};
      }),
      map(() => true),
      catchError(err => {
        console.error('[Stepper] Error at Step 2:', err);
        return of(false);
      })
    );
  }

  private saveCustomFields() {
    return this.enrollmentService.updateCustomFields(this.currentApplicationId()!, this.formData().specificResponses).pipe(
      tap(app => this.application.set(app)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private saveSubscriptions() {
    const subs = [];
    if (this.formData().services.canteen) subs.push({ serviceCode: 'CANTEEN', optionCode: 'STANDARD' });
    if (this.formData().services.transport) subs.push({ serviceCode: 'TRANSPORT', optionCode: 'STANDARD' });
    return this.enrollmentService.updateSubscriptions(this.currentApplicationId()!, subs).pipe(
      tap(app => this.application.set(app)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  onFileSelected(docCode: string, event: any) {
    const file = event.target.files[0];
    const currentApp = this.application();
    const session = this.sessionService.getSession();

    // Fallback : on récupère les infos vitales soit dans le signal, soit dans la session persistante
    const reference = currentApp?.reference || session?.reference;
    const accessCode = currentApp?.accessCode || session?.accessCode;
    const appId = this.currentApplicationId();

    console.log(`[Stepper] Tentative d'upload pour ${docCode}:`, { fileName: file?.name, reference, appId });

    if (!file) return;
    if (!appId || !reference || !accessCode) {
      console.warn('[Stepper] Upload impossible : Infos de session incomplètes', { appId, reference });
      this.notificationService.warning("Session incomplète. Veuillez recommencer l'étape 1.");
      return;
    }

    this.uploadingDocCode.set(docCode);

    this.documentService.getUploadTicket({
      fileName: file.name,
      contentType: file.type,
      serviceOrigin: 'enrollment'
    }).pipe(
      switchMap(ticket => {
        console.log('[Stepper] Ticket reçu, envoi direct au stockage...');
        return this.documentService.uploadFileDirectly(ticket.uploadUrl, file).pipe(
          map(() => ticket)
        );
      }),
      switchMap(ticket => {
        console.log('[Stepper] Upload réussi, liaison au dossier...');
        return this.enrollmentService.uploadDocument(appId, docCode, ticket.fileId);
      }),
      switchMap(() => {
        console.log('[Stepper] Liaison réussie, rafraîchissement final...');
        return this.enrollmentService.trackApplication(reference, accessCode);
      }),
      tap(freshApp => {
        this.application.set(freshApp);
        this.notificationService.success(`Le document "${file.name}" a été chargé.`);
      }),
      catchError(err => {
        console.error('[Stepper] ERREUR UPLOAD:', err);
        this.notificationService.error("Le fichier n'a pas pu être envoyé.");
        return of(null);
      }),
      finalize(() => {
        this.uploadingDocCode.set(null);
        event.target.value = '';
      })
    ).subscribe();
  }

  viewDocument(fileId: string | undefined) {
    if (!fileId) return;
    this.documentService.getViewUrl(fileId).subscribe(url => window.open(url, '_blank'));
  }

  submitFinal() {
    this.isSubmitting.set(true);
    this.enrollmentService.submitApplication(this.currentApplicationId()!).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (finalApp) => {
        this.notificationService.success('Dossier soumis avec succès.');
        this.sessionService.clearSession();
        this.router.navigate(['/enrollment/tracker', finalApp.reference], {
          queryParams: { accessCode: finalApp.accessCode }
        });
      },
      error: (err) => console.error('Erreur soumission finale:', err)
    });
  }

  getFileIcon(fileName: string): any {
    if (fileName.includes('Photo')) return FileImage;
    if (fileName.includes('Bulletin')) return FileSpreadsheet;
    return FileText;
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
}
