import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, User, Users, FileText, Sparkles, CheckCircle, ArrowLeft, ArrowRight, Upload, X, GraduationCap, RefreshCw, Eye } from 'lucide-angular';
import { catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { DocumentEngineService } from '../../../../core/services/document-engine.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { Level, AcademicYear, Filiere } from '../../../../core/models/academic.model';
import { AdmissionApplication as Application } from '../../../../core/models/enrollment.model';
import { Router } from '@angular/router';

import { NotificationService } from '../../../../shared/services/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type StepperStep = 'GUARDIAN' | 'STUDENT' | 'DOCS' | 'REVIEW';

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
  private tenantContext = inject(TenantContextService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // --- ÉTATS DU STEPPER ---
  currentStep = signal<StepperStep>('GUARDIAN');
  currentApplicationId = signal<string | null>(null);
  application = signal<Application | null>(null);
  isSubmitting = signal(false);
  uploadingDocCode = signal<string | null>(null);

  // --- DONNÉES RÉFÉRENTIELLES ---
  availableLevels = signal<Level[]>([]);
  availableFilieres = signal<Filiere[]>([]);
  activeYear = signal<AcademicYear | null>(null);

  // --- DONNÉES DU FORMULAIRE ---
  formData = signal({
    primaryGuardian: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relation: 'FATHER' as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER',
      profession: '',
      address: ''
    },
    student: { 
      firstName: '', 
      lastName: '', 
      birthDate: '', 
      birthPlace: '',
      gender: '' as 'MALE' | 'FEMALE',
      nationality: 'Sénégalaise',
      previousSchool: '',
      requestedLevelId: '',
      filiereId: null as string | null
    }
  });

  // --- CALCULS RÉACTIFS ---
  
  progress = computed(() => {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'DOCS', 'REVIEW'];
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  showFiliereSelector = computed(() => {
    return this.availableFilieres().length > 0 && this.formData().student.requestedLevelId !== '';
  });

  selectedLevelName = computed(() => {
    const levelId = this.formData().student.requestedLevelId;
    return this.availableLevels().find(l => l.id === levelId)?.name || 'Non sélectionné';
  });

  ngOnInit() {
    this.loadInitialData();
    this.checkExistingSession();
  }

  private loadInitialData() {
    forkJoin({
      levels: this.academicService.getLevels(),
      filieres: this.academicService.getFilieres(),
      year: this.academicService.getCurrentYear()
    }).pipe(
      tap(({ levels, filieres, year }) => {
        this.availableLevels.set(levels);
        this.availableFilieres.set(filieres);
        this.activeYear.set(year);
      }),
      catchError(err => {
        console.error('Erreur chargement Academic data:', err);
        return of(null);
      })
    ).subscribe();
  }

  private checkExistingSession() {
    const session = this.sessionService.getSession();
    if (session) {
      this.isSubmitting.set(true);
      this.enrollmentService.trackApplication(session.reference, session.accessCode).pipe(
        tap(app => {
          if (app && app.status === 'DRAFT') {
            this.application.set(app);
            this.currentApplicationId.set(app.id);
            this.resumeFormData(app);
            
            const savedStep = session.currentStep as StepperStep;
            if (savedStep && savedStep !== 'GUARDIAN') {
              this.currentStep.set(savedStep);
            } else {
              this.currentStep.set('STUDENT');
            }
          }
        }),
        catchError(e => {
          console.warn('Session expirée ou invalide.');
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
        profession: app.primaryGuardian?.profession || '',
        address: app.primaryGuardian?.address || ''
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
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    
    this.isSubmitting.set(true);
    let operation$;

    if (this.currentStep() === 'GUARDIAN' && !this.currentApplicationId()) {
      operation$ = this.initializeApplication();
    } 
    else if (this.currentStep() === 'GUARDIAN') {
      operation$ = this.saveGuardianInfo();
    }
    else if (this.currentStep() === 'STUDENT') {
      operation$ = this.saveCandidateInfo();
    } else {
      operation$ = of(true);
    }

    operation$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe(success => {
      if (success && currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        this.currentStep.set(nextStep);
        this.sessionService.updateStep(nextStep);
        window.scrollTo(0, 0);
      }
    });
  }

  private initializeApplication() {
    const tenantId = this.tenantContext.activeTenant()?.id || 'bruno-test-full';
    const yearId = this.activeYear()?.id;
    if (!yearId) return of(false);

    const payload = {
      tenantId,
      type: 'NEW' as const,
      academicYearId: yearId,
      primaryGuardian: {
        firstName: this.formData().primaryGuardian.firstName,
        lastName: this.formData().primaryGuardian.lastName,
        email: this.formData().primaryGuardian.email,
        phone: this.formData().primaryGuardian.phone,
        relation: this.formData().primaryGuardian.relation
      }
    };

    return this.enrollmentService.createApplication(payload).pipe(
      tap(res => {
        this.notificationService.success('Dossier d\'admission initialisé avec succès.');
        this.application.set(res);
        this.currentApplicationId.set(res.id);
        const studentFirstName = res.candidate?.firstName || this.formData().student.firstName || '';
        this.sessionService.saveSession(res.reference, res.accessCode, studentFirstName, 'STUDENT');
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private saveGuardianInfo() {
    const id = this.currentApplicationId();
    if (!id) return of(false);
    return this.enrollmentService.updateGuardians(id, this.formData().primaryGuardian).pipe(
      tap(updatedApp => {
        this.notificationService.info('Informations du responsable enregistrées.');
        this.application.set(updatedApp);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private saveCandidateInfo() {
    const id = this.currentApplicationId();
    if (!id) return of(false);
    
    const payload = {
      info: {
        firstName: this.formData().student.firstName,
        lastName: this.formData().student.lastName,
        gender: this.formData().student.gender,
        birthDate: this.formData().student.birthDate,
        birthPlace: this.formData().student.birthPlace,
        nationality: this.formData().student.nationality,
        previousSchool: this.formData().student.previousSchool
      },
      levelId: this.formData().student.requestedLevelId,
      filiereId: this.formData().student.filiereId
    };

    return this.enrollmentService.updateCandidate(id, payload).pipe(
      tap(updatedApp => {
        this.notificationService.info('Informations du candidat enregistrées.');
        this.application.set(updatedApp);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  onFileSelected(docCode: string, event: any) {
    const file = event.target.files[0];
    if (!file || !this.currentApplicationId()) return;

    this.uploadingDocCode.set(docCode);

    this.documentService.getUploadTicket({
      fileName: file.name,
      contentType: file.type,
      serviceOrigin: 'enrollment'
    }).pipe(
      switchMap(ticket => 
        this.documentService.uploadFileDirectly(ticket.uploadUrl, file).pipe(
          switchMap(() => this.enrollmentService.uploadDocument(this.currentApplicationId()!, docCode, ticket.fileId)),
          map(() => ticket)
        )
      ),
      switchMap(() => {
        this.notificationService.success('Document envoyé avec succès.');
        const session = this.sessionService.getSession();
        if (session) {
          return this.enrollmentService.trackApplication(session.reference, session.accessCode);
        }
        return of(null);
      }),
      tap(freshApp => {
        if (freshApp) this.application.set(freshApp);
      }),
      finalize(() => this.uploadingDocCode.set(null)),
      catchError(err => {
        console.error(`Échec de l'upload pour ${docCode}:`, err);
        return of(null);
      })
    ).subscribe();
  }

  viewDocument(fileId: string | undefined) {
    if (!fileId) return;
    this.documentService.getViewUrl(fileId).subscribe({
      next: (viewUrl) => window.open(viewUrl, '_blank'),
      error: (e) => console.error('Impossible de générer l\'url de vue:', e)
    });
  }

  submitFinal() {
    const id = this.currentApplicationId();
    if (!id) return;
    this.isSubmitting.set(true);
    
    this.enrollmentService.submitApplication(id).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe(finalApp => {
      if (finalApp) {
        this.notificationService.success('Votre dossier a été soumis avec succès.');
        this.sessionService.clearSession();
        this.router.navigate(['/enrollment/tracker', finalApp.reference], { 
          queryParams: { accessCode: finalApp.accessCode } 
        });
      }
    });
  }

  prevStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      this.currentStep.set(prevStep);
      this.sessionService.updateStep(prevStep);
      window.scrollTo(0, 0);
    }
  }

  // --- ICÔNES ---
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
}
