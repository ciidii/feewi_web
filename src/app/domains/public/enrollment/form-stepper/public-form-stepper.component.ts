import {Component, signal, computed, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, User, Users, FileText, Sparkles, CheckCircle, ArrowLeft, ArrowRight, Upload, X } from 'lucide-angular';

import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';

export type StepperStep = 'STUDENT' | 'PARENTS' | 'DOCS' | 'SERVICES' | 'REVIEW';

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

  currentStep = signal<StepperStep>('STUDENT');
  currentApplicationId = signal<string | null>(null);
  isSubmitting = signal(false);

  // Données du formulaire (Signals pour réactivité totale)
  formData = signal({
    student: { firstName: '', lastName: '', birthDate: '', gender: '' as 'M' | 'F', level: '', requestedLevelId: 'uuid-cm1' },
    parents: [{ role: 'Père', fullName: '', phone: '', email: '', isPrimary: true, address: '' }],
    services: { canteen: false, transport: false, extraCurricular: [] as string[] },
    documents: [] as any[]
  });

  // Progression calculée
  progress = computed(() => {
    const steps: StepperStep[] = ['STUDENT', 'PARENTS', 'DOCS', 'SERVICES', 'REVIEW'];
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  // Méthodes de navigation
  async nextStep() {
    const steps: StepperStep[] = ['STUDENT', 'PARENTS', 'DOCS', 'SERVICES', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());

    if (this.currentStep() === 'STUDENT' && !this.currentApplicationId()) {
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

  /**
   * Créer le dossier initialement dans le backend
   */
  private async initializeApplication() {
    this.isSubmitting.set(true);
    try {
      const res = await this.enrollmentService.createApplication({
        type: 'NEW',
        academicYearId: 'year-2026', // À dynamiser plus tard
        levelId: this.formData().student.requestedLevelId
      }).toPromise();

      if (res) {
        this.currentApplicationId.set(res.id);
        // Sauvegarder la session pour la persistance (User-First !)
        this.sessionService.saveSession(res.reference, res.accessCode, `${this.formData().student.firstName} ${this.formData().student.lastName}`);
        // Mettre à jour les infos candidat immédiatement après création
        await this.saveCandidateInfo();
      }
    } catch (e) {
      console.error('Erreur lors de l\'initialisation du dossier', e);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Sauvegarder les infos candidat (Auto-save)
   */
  private async saveCandidateInfo() {
    const id = this.currentApplicationId();
    if (!id) return;

    try {
      await this.enrollmentService.updateCandidate(id, {
        firstName: this.formData().student.firstName,
        lastName: this.formData().student.lastName,
        birthDate: this.formData().student.birthDate,
        gender: this.formData().student.gender,
        requestedLevelId: this.formData().student.requestedLevelId
      }).toPromise();
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du candidat', e);
    }
  }

  /**
   * Sauvegarder les infos parents (Auto-save)
   */
  private async saveGuardiansInfo() {
    const id = this.currentApplicationId();
    if (!id) return;

    try {
      await this.enrollmentService.updateGuardians(id, this.formData().parents).toPromise();
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des responsables', e);
    }
  }

  prevStep() {
    const steps: StepperStep[] = ['STUDENT', 'PARENTS', 'DOCS', 'SERVICES', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
      window.scrollTo(0, 0);
    }
  }

  // Icônes
  readonly User = User;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly Sparkles = Sparkles;
  readonly CheckCircle = CheckCircle;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Upload = Upload;
  readonly X = X;
}
