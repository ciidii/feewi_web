import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, User, Users, FileText, Sparkles, CheckCircle, ArrowLeft, ArrowRight, Upload, X, GraduationCap, RefreshCw } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { Level, AcademicYear, Filiere } from '../../../../core/models/academic.model';
import { AdmissionApplication as Application } from '../../../../core/models/enrollment.model';
import { Router } from '@angular/router';

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
  private sessionService = inject(AdmissionSessionService);
  private academicService = inject(AcademicService);
  private tenantContext = inject(TenantContextService);
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

  async ngOnInit() {
    await this.loadInitialData();
    await this.checkExistingSession();
  }

  async loadInitialData() {
    try {
      const [levels, filieres, year] = await Promise.all([
        this.academicService.getLevels(),
        this.academicService.getFilieres(),
        this.academicService.getCurrentYear()
      ]);
      this.availableLevels.set(levels);
      this.availableFilieres.set(filieres);
      this.activeYear.set(year);
    } catch (e) {
      console.error('Erreur chargement Academic data:', e);
    }
  }

  async checkExistingSession() {
    const session = this.sessionService.getSession();
    if (session) {
      this.isSubmitting.set(true);
      try {
        const app = await firstValueFrom(this.enrollmentService.trackApplication(session.reference, session.accessCode));
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
      } catch (e) {
        console.warn('Session expirée ou invalide.');
        this.sessionService.clearSession();
      } finally {
        this.isSubmitting.set(false);
      }
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
        requestedLevelId: app.academicYearId || '', // Simplification
        filiereId: null 
      }
    }));
  }

  async nextStep() {
    const steps: StepperStep[] = ['GUARDIAN', 'STUDENT', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    let stepSuccess = true;

    this.isSubmitting.set(true);
    try {
      if (this.currentStep() === 'GUARDIAN' && !this.currentApplicationId()) {
        await this.initializeApplication();
      } 
      else if (this.currentStep() === 'GUARDIAN') {
        await this.saveGuardianInfo();
      }
      else if (this.currentStep() === 'STUDENT') {
        await this.saveCandidateInfo();
      }
    } catch (e) {
      console.error('NextStep API Error:', e);
      alert('Erreur lors de la sauvegarde. Veuillez vérifier vos informations.');
      stepSuccess = false;
    } finally {
      this.isSubmitting.set(false);
    }

    if (stepSuccess && currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      this.currentStep.set(nextStep);
      this.sessionService.updateStep(nextStep);
      window.scrollTo(0, 0);
    }
  }

  private async initializeApplication() {
    const tenantId = this.tenantContext.activeTenant()?.id || 'bruno-test-full';
    const yearId = this.activeYear()?.id;
    if (!yearId) throw new Error('Pas d’année académique active.');

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

    const res = await firstValueFrom(this.enrollmentService.createApplication(payload));
    if (res) {
      this.application.set(res);
      this.currentApplicationId.set(res.id);
      const studentFirstName = res.candidate?.firstName || this.formData().student.firstName || '';
      this.sessionService.saveSession(res.reference, res.accessCode, studentFirstName, 'STUDENT');
    }
  }

  private async saveGuardianInfo() {
    const id = this.currentApplicationId();
    if (!id) return;
    const updatedApp = await firstValueFrom(this.enrollmentService.updateGuardians(id, this.formData().primaryGuardian));
    if (updatedApp) this.application.set(updatedApp);
  }

  private async saveCandidateInfo() {
    const id = this.currentApplicationId();
    if (!id) return;
    
    // Payload imbriqué selon l'exemple Bruno
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

    const updatedApp = await firstValueFrom(this.enrollmentService.updateCandidate(id, payload));
    if (updatedApp) this.application.set(updatedApp);
  }

  async onFileSelected(docCode: string, event: any) {
    const file = event.target.files[0];
    if (!file || !this.currentApplicationId()) return;
    this.uploadingDocCode.set(docCode);
    try {
      const mockFileUrl = `https://cdn.feewi.com/mock/${this.currentApplicationId()}/${docCode}_${file.name}`;
      const updatedApp = await firstValueFrom(this.enrollmentService.uploadDocument(this.currentApplicationId()!, docCode, mockFileUrl));
      if (updatedApp) this.application.set(updatedApp);
    } finally {
      this.uploadingDocCode.set(null);
    }
  }

  async submitFinal() {
    const id = this.currentApplicationId();
    if (!id) return;
    this.isSubmitting.set(true);
    try {
      const finalApp = await firstValueFrom(this.enrollmentService.submitApplication(id));
      if (finalApp) {
        this.sessionService.clearSession();
        this.router.navigate(['/enrollment/tracker', finalApp.reference]);
      }
    } finally {
      this.isSubmitting.set(false);
    }
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
}
