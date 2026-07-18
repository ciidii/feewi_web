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

export type AdmissionState =
  'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'TESTING'
  | 'ADMITTED'
  | 'WAITLIST'
  | 'VALIDATED'
  | 'REJECTED'
  | 'CANCELLED';

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
  templateUrl: './enrollment-workflow.component.html',
  styleUrls: ['./enrollment-workflow.component.scss']
})
export class EnrollmentWorkflowComponent {
  /** État actuel du dossier d'admission */
  state = input.required<AdmissionState>();

  /** Mode d'affichage */
  mode = input<'horizontal' | 'vertical' | 'compact'>('horizontal');

  /** Afficher les libellés */
  showLabels = input<boolean>(true);

  /** Liste des étapes principales du workflow */
  steps: WorkflowStep[] = [
    {state: 'SUBMITTED', label: 'Soumis', icon: FileText, description: 'Le dossier est enregistré.'},
    {state: 'VERIFIED', label: 'Vérifié', icon: ClipboardCheck, description: 'Documents approuvés par le secrétariat.'},
    {state: 'TESTING', label: 'Évaluation', icon: GraduationCap, description: 'Test de niveau en cours ou terminé.'},
    {state: 'VALIDATED', label: 'Décision', icon: UserCheck, description: 'Admission confirmée par la direction.'}
  ];

  /**
   * Détermine l'index de l'étape actuelle. ADMITTED/WAITLIST (décision pédagogique prise, en
   * attente de validation finale) et REJECTED/CANCELLED (issue terminale) n'apparaissent pas
   * dans `steps` : sans ce rattachement, currentStepIndex vaudrait -1 et AUCUNE étape ne
   * s'affichait comme active ou complétée, rendant le workflow illisible pour ces statuts.
   */
  currentStepIndex = computed(() => {
    const currentState = this.state();
    const idx = this.steps.findIndex(s => s.state === currentState);
    if (idx !== -1) return idx;
    if (['ADMITTED', 'WAITLIST', 'REJECTED', 'CANCELLED'].includes(currentState)) {
      return this.steps.length - 1;
    }
    return -1; // DRAFT : aucune étape commencée
  });

  /** Issue terminale négative — l'étape courante doit se distinguer visuellement d'une progression normale. */
  isNegativeOutcome = computed(() => ['REJECTED', 'CANCELLED'].includes(this.state()));

  /** Libellé de l'étape courante, à afficher en toutes lettres à côté des icônes en mode compact. */
  currentStepLabel = computed(() => {
    const currentState = this.state();
    if (currentState === 'REJECTED') return 'Rejeté';
    if (currentState === 'CANCELLED') return 'Annulé';
    const idx = this.currentStepIndex();
    return idx >= 0 ? this.steps[idx].label : 'Brouillon';
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
