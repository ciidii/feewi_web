import {Component, signal, computed, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, CheckCircle, MessageSquare, Phone, Mail, FileText, Info, ArrowLeft, RefreshCw, Search, ArrowRight } from 'lucide-angular';
import {
  AdmissionState
} from '../../../school-app/features/admissions/components/admission-workflow/admission-workflow.component';
import { ActivatedRoute } from '@angular/router';
import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AdmissionApplication } from '../../../../core/models/enrollment.model';
import { finalize, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-public-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
  templateUrl: './public-tracker.component.html',
  styleUrls: ['./public-tracker.component.scss']
})
export class PublicTrackerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private enrollmentService = inject(EnrollmentPublicService);
  private sessionService = inject(AdmissionSessionService);

  // État du dossier chargé depuis l'API
  application = signal<AdmissionApplication | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Formulaire de recherche (si pas d'ID en URL)
  searchData = {
    reference: '',
    accessCode: ''
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadApplicationData(id);
      } else {
        this.isLoading.set(false);
        this.application.set(null);
      }
    });
  }

  /**
   * Charger les données de suivi via l'API
   */
  loadApplicationData(reference: string) {
    const queryAccessCode = this.route.snapshot.queryParamMap.get('accessCode');
    const session = this.sessionService.getSession();

    const accessCode = queryAccessCode || (session?.reference === reference ? session?.accessCode : null);

    if (!accessCode) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.enrollmentService.trackApplication(reference, accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => this.application.set(res),
      error: () => this.error.set('Référence ou code d’accès incorrect. Veuillez vérifier vos informations.')
    });
  }

  onSearch() {
    if (!this.searchData.reference || !this.searchData.accessCode) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.enrollmentService.trackApplication(this.searchData.reference, this.searchData.accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        this.application.set(res);
        this.router.navigate(['/enrollment/tracker', res.reference], {
          queryParams: { accessCode: this.searchData.accessCode },
          replaceUrl: true
        });
      },
      error: () => this.error.set('Aucun dossier trouvé avec cette référence et ce code.')
    });
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
  readonly Search = Search;
  readonly ArrowRight = ArrowRight;
}
