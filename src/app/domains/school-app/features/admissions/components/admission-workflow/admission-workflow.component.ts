import {Component, computed, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  AlertCircle,
  CheckCircle,
  Circle,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  LucideAngularModule,
  UserCheck
} from 'lucide-angular';

export type AdmissionState = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'TESTING' | 'ADMITTED' | 'WAITLIST' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';

export interface WorkflowStep {
  state: AdmissionState;
  label: string;
  icon: any;
  description: string;
}

@Component({
  selector: 'app-admission-workflow',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './admission-workflow.component.html',
  styleUrls: ['./admission-workflow.component.scss']
})
export class AdmissionWorkflowComponent {
  /** État actuel du dossier d'admission */
  state = input.required<AdmissionState>();

  /** Liste des étapes principales du workflow */
  steps: WorkflowStep[] = [
    { state: 'SUBMITTED', label: 'Soumis', icon: FileText, description: 'Le dossier est enregistré.' },
    { state: 'VERIFIED', label: 'Vérifié', icon: ClipboardCheck, description: 'Documents approuvés par le secrétariat.' },
    { state: 'TESTING', label: 'Évaluation', icon: GraduationCap, description: 'Test de niveau en cours ou terminé.' },
    { state: 'VALIDATED', label: 'Décision', icon: UserCheck, description: 'Admission confirmée par la direction.' }
  ];

  /** Détermine l'index de l'étape actuelle */
  currentStepIndex = computed(() => {
    const currentState = this.state();
    return this.steps.findIndex(s => s.state === currentState);
  });

  /** Détermine si une étape est passée, active ou future */
  getStepStatus(index: number): 'completed' | 'active' | 'future' {
    const current = this.currentStepIndex();
    if (index < current) return 'completed';
    if (index === current) return 'active';
    return 'future';
  }

  // Exposition des icônes pour le template
  readonly CheckCircle = CheckCircle;
  readonly Circle = Circle;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
}
