import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, User, Users, FileText, Sparkles, CheckCircle, ArrowLeft, ArrowRight, Upload, X, GraduationCap, RefreshCw } from 'lucide-angular';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { Level, AcademicYear, Filiere } from '../../../../core/models/academic.model';
import { AdmissionApplication as Application } from '../../../../core/models/enrollment.model';
import { Router } from '@angular/router';

export type StepperStep = 'PRE_ENROLL' | 'STUDENT' | 'PARENTS' | 'DOCS' | 'REVIEW';

@Component({
  selector: 'app-public-form-stepper',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './public-form-stepper.component.html',
  styleUrls: ['./public-form-stepper.component.scss']
})
export class PublicFormStepperComponent {
  private enrollmentService = inject(EnrollmentPublicService);
  private sessionService = inject(AdmissionSessionService);
  private academicService = inject(AcademicService);
  private tenantContext = inject(TenantContextService);
  private router = inject(Router);

  // --- ÉTATS DU STEPPER ---
  currentStep = signal<StepperStep>('PRE_ENROLL');
  currentApplicationId = signal<string | null>(null);
  application = signal<Application | null>(null);
  isSubmitting = signal(false);
  uploadingDocCode = signal<string | null>(null);

  // --- DONNÉES RÉFÉRENTIELLES (API) ---
  availableLevels = signal<Level[]>([]);
  availableFilieres = signal<Filiere[]>([]);
  activeYear = signal<AcademicYear | null>(null);

  // --- DONNÉES DU FORMULAIRE ---
  formData = signal({
    preEnroll: {
      academicYearId: '',
      requestedLevelId: '',
      filiereId: null as string | null
    },
    student: { 
      firstName: '', 
      lastName: '', 
      birthDate: '', 
      birthPlace: '',
      gender: '' as 'MALE' | 'FEMALE',
      nationality: 'Sénégalaise',
      previousSchool: ''
    },
    parents: [{ 
      relation: 'FATHER' as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER', 
      firstName: '', 
      lastName: '', 
      phone: '', 
      email: '', 
      profession: '',
      isPrimary: true, 
      address: '' 
    }],
    services: { canteen: false, transport: false, extraCurricular: [] as string[] },
    documents: [] as any[]
  });

  // --- CALCULS RÉACTIFS (COMPUTED) ---
  
  progress = computed(() => {
    const steps: StepperStep[] = ['PRE_ENROLL', 'STUDENT', 'PARENTS', 'DOCS', 'REVIEW'];
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  showFiliereSelector = computed(() => {
    return this.availableFilieres().length > 0 && this.formData().preEnroll.requestedLevelId !== '';
  });

  selectedLevelName = computed(() => {
    const levelId = this.formData().preEnroll.requestedLevelId;
    return this.availableLevels().find(l => l.id === levelId)?.name || 'Non sélectionné';
  });

  constructor() {
    this.loadInitialData();
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
      
      if (year) {
        this.formData.update(f => ({ ...f, preEnroll: { ...f.preEnroll, academicYearId: year.id }}));
      }
    } catch (e) {
      console.error('Erreur chargement Academic data:', e);
    }
  }

  // --- NAVIGATION & LOGIQUE API ---

  async nextStep() {
    const steps: StepperStep[] = ['PRE_ENROLL', 'STUDENT', 'PARENTS', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());

    if (this.currentStep() === 'PRE_ENROLL' && !this.currentApplicationId()) {
      if (!this.formData().preEnroll.requestedLevelId) {
        alert('Veuillez sélectionner un niveau.');
        return;
      }
      await this.initializeApplication();
    } else if (this.currentStep() === 'STUDENT') {
      await this.saveCandidateInfo();
    } else if (this.currentStep() === 'PARENTS') {
      await this.saveGuardiansInfo();
    }

    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
      window.scrollTo(0, 0);
    }
  }

  prevStep() {
    const steps: StepperStep[] = ['PRE_ENROLL', 'STUDENT', 'PARENTS', 'DOCS', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  }

  private async initializeApplication() {
    this.isSubmitting.set(true);
    const tenantId = this.tenantContext.activeTenant()?.id || 'bruno-test-full';

    try {
      const res = await this.enrollmentService.createApplication({
        tenantId: tenantId,
        type: 'NEW',
        academicYearId: this.formData().preEnroll.academicYearId,
        levelId: this.formData().preEnroll.requestedLevelId,
        filiereId: this.formData().preEnroll.filiereId
      }).toPromise();

      if (res) {
        this.application.set(res);
        this.currentApplicationId.set(res.id);
        this.sessionService.saveSession(res.reference, res.accessCode);
      }
    } catch (e) {
      console.error('Initialisation failed:', e);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async saveCandidateInfo() {
    const id = this.currentApplicationId();
    if (!id) return;
    try {
      await this.enrollmentService.updateCandidate(id, {
        firstName: this.formData().student.firstName,
        lastName: this.formData().student.lastName,
        gender: this.formData().student.gender,
        birthDate: this.formData().student.birthDate,
        birthPlace: this.formData().student.birthPlace,
        nationality: this.formData().student.nationality,
        previousSchool: this.formData().student.previousSchool
      }).toPromise();
    } catch (e) { console.error('Save candidate failed:', e); }
  }

  private async saveGuardiansInfo() {
    const id = this.currentApplicationId();
    if (!id) return;
    try {
      const primaryGuardian = this.formData().parents[0];
      const payload = {
        firstName: primaryGuardian.firstName,
        lastName: primaryGuardian.lastName,
        email: primaryGuardian.email,
        phone: primaryGuardian.phone,
        profession: primaryGuardian.profession,
        relation: primaryGuardian.relation,
        address: primaryGuardian.address,
        isPrimary: true
      };
      
      const updatedApp = await this.enrollmentService.updateGuardians(id, payload as any).toPromise();
      if (updatedApp) this.application.set(updatedApp);
    } catch (e) { console.error('Save guardians failed:', e); }
  }

  /**
   * Gérer la sélection et l'upload d'un document
   */
  async onFileSelected(docCode: string, event: any) {
    const file = event.target.files[0];
    if (!file || !this.currentApplicationId()) return;

    this.uploadingDocCode.set(docCode);
    try {
      // 1. Simulation d'upload (URL fictive pour le test backend)
      const mockFileUrl = `https://cdn.feewi.com/mock/docs/${this.currentApplicationId()}/${docCode}_${file.name}`;
      
      // 2. Envoi de l'URL au backend
      const updatedApp = await this.enrollmentService.uploadDocument(
        this.currentApplicationId()!, 
        docCode, 
        mockFileUrl
      ).toPromise();

      if (updatedApp) {
        this.application.set(updatedApp);
      }
    } catch (e) {
      console.error(`Erreur upload document ${docCode}:`, e);
    } finally {
      this.uploadingDocCode.set(null);
    }
  }

  /**
   * Soumission finale du dossier au serveur
   */
  async submitFinal() {
    const id = this.currentApplicationId();
    if (!id) return;

    this.isSubmitting.set(true);
    try {
      const finalApp = await this.enrollmentService.submitApplication(id).toPromise();
      if (finalApp) {
        // Succès : On nettoie la session de saisie
        const reference = finalApp.reference;
        this.sessionService.clearSession();
        // Redirection vers le tracker pour voir le succès
        this.router.navigate(['/enrollment/tracker', reference]);
      }
    } catch (e) {
      console.error('Erreur lors de la soumission finale', e);
      alert('Une erreur est survenue lors de la soumission. Veuillez vérifier que tous les documents obligatoires sont présents.');
    } finally {
      this.isSubmitting.set(false);
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
