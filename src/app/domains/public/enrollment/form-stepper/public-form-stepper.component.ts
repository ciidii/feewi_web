import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, User, Users, FileText, Sparkles, CheckCircle, ArrowLeft, ArrowRight, Upload, X } from 'lucide-angular';

export type StepperStep = 'STUDENT' | 'PARENTS' | 'DOCS' | 'SERVICES' | 'REVIEW';

@Component({
  selector: 'app-public-form-stepper',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './public-form-stepper.component.html',
  styleUrls: ['./public-form-stepper.component.scss']
})
export class PublicFormStepperComponent {
  currentStep = signal<StepperStep>('STUDENT');
  
  // Données du formulaire (Signals pour réactivité totale)
  formData = signal({
    student: { firstName: '', lastName: '', birthDate: '', gender: '', level: '' },
    parents: [{ role: 'Père', name: '', phone: '', email: '' }],
    services: { canteen: false, transport: false, extraCurricular: [] as string[] },
    documents: [] as any[]
  });

  // Progression calculée
  progress = computed(() => {
    const steps: StepperStep[] = ['STUDENT', 'PARENTS', 'DOCS', 'SERVICES', 'REVIEW'];
    return ((steps.indexOf(this.currentStep()) + 1) / steps.length) * 100;
  });

  // Méthodes de navigation
  nextStep() {
    const steps: StepperStep[] = ['STUDENT', 'PARENTS', 'DOCS', 'SERVICES', 'REVIEW'];
    const currentIndex = steps.indexOf(this.currentStep());
    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
      window.scrollTo(0, 0);
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
