import {Component, signal, computed, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Clock, CheckCircle, MessageSquare, Phone, Mail, FileText, Info, ArrowLeft, RefreshCw } from 'lucide-angular';
import {
  AdmissionState
} from '../../../school-app/features/admissions/components/admission-workflow/admission-workflow.component';
import { ActivatedRoute } from '@angular/router';
import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AdmissionApplication } from '../../../../core/models/enrollment.model';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-public-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './public-tracker.component.html',
  styleUrls: ['./public-tracker.component.scss']
})
export class PublicTrackerComponent {
  private route = inject(ActivatedRoute);
  private enrollmentService = inject(EnrollmentPublicService);
  private sessionService = inject(AdmissionSessionService);

  // État du dossier chargé depuis l'API
  application = signal<AdmissionApplication | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.loadApplicationData();
  }

  /**
   * Charger les données de suivi via l'API
   */
  async loadApplicationData() {
    const reference = this.route.snapshot.paramMap.get('id');
    const queryAccessCode = this.route.snapshot.queryParamMap.get('accessCode');
    const session = this.sessionService.getSession();

    const accessCode = queryAccessCode || (session?.reference === reference ? session?.accessCode : null);

    // Pour tracker, on a besoin du accessCode (sécurité)
    if (!reference || !accessCode) {
      this.error.set('Session introuvable ou invalide. Veuillez vous reconnecter.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    try {
      // Utilisation de firstValueFrom pour être cohérent avec le reste du projet
      const res = await firstValueFrom(this.enrollmentService.trackApplication(reference, accessCode));
      if (res) {
        this.application.set(res);
      }
    } catch (e) {
      this.error.set('Impossible de récupérer les informations de votre dossier.');
    } finally {
      this.isLoading.set(false);
    }
  }

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
