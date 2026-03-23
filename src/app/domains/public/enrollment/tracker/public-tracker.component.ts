import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Clock, CheckCircle, MessageSquare, Phone, Mail, FileText, Info, ArrowLeft, RefreshCw } from 'lucide-angular';
import {
  AdmissionState
} from '../../../school-app/features/admissions/components/admission-workflow/admission-workflow.component';
@Component({
  selector: 'app-public-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './public-tracker.component.html',
  styleUrls: ['./public-tracker.component.scss']
})
export class PublicTrackerComponent {
  // État simulé du dossier
  admissionId = signal('ADM-2026-8842');
  currentStatus = signal<AdmissionState>('SUBMITTED');
  studentName = signal('Jean Dupont');

  // Timeline des événements
  events = signal([
    { title: 'Dossier Soumis', date: 'Aujourd\'hui, 14:20', desc: 'Votre demande a bien été enregistrée par notre système.', status: 'completed' },
    { title: 'Vérification Administrative', date: 'En cours', desc: 'Le secrétariat vérifie la conformité de vos pièces jointes.', status: 'active' },
    { title: 'Convocation au Test', date: 'À venir', desc: 'Une date vous sera proposée dès que le dossier sera validé.', status: 'future' },
    { title: 'Décision Finale', date: 'À venir', desc: 'La Direction rendra son arbitrage pédagogique.', status: 'future' }
  ]);

  // Messages contextuels selon l'état
  statusMessage = computed(() => {
    switch(this.currentStatus()) {
      case 'SUBMITTED': return 'Votre dossier est entre de bonnes mains. Nous effectuons actuellement les vérifications administratives.';
      case 'VERIFIED': return 'Bonne nouvelle ! Vos documents sont conformes. Préparez-vous pour le test de niveau.';
      case 'TESTING': return 'L\'évaluation est terminée. Les résultats sont en cours de traitement par le jury.';
      default: return 'Suivez l\'avancement de votre demande en temps réel.';
    }
  });

  // Icônes
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly MessageSquare = MessageSquare;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly FileText = FileText;
  readonly Info = Info;
  readonly ArrowLeft = ArrowLeft;
  readonly RefreshCw = RefreshCw;
}
