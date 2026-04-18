import {Component, signal, computed, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, CheckCircle, MessageSquare, Phone, Mail, FileText, Info, ArrowLeft, RefreshCw, Search, ArrowRight, ShieldCheck, LayoutGrid, Check, Sparkles } from 'lucide-angular';
import { ActivatedRoute } from '@angular/router';
import { EnrollmentPublicService } from '../../../../core/services/enrollment-public.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { Admission } from '../../../../core/models/enrollment.model';
import { finalize } from 'rxjs';
import { FwButtonComponent } from '../../../../shared/components/button/button.component';
import { FwBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { FwEmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-public-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule, FwButtonComponent, FwBadgeComponent],
  templateUrl: './public-tracker.component.html',
  styleUrls: ['./public-tracker.component.scss']
})
export class PublicTrackerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private enrollmentService = inject(EnrollmentPublicService);
  private sessionService = inject(AdmissionSessionService);

  // État du dossier chargé depuis l'API
  application = signal<Admission | null>(null);
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

  loadApplicationData(reference: string) {
    const queryAccessCode = this.route.snapshot.queryParamMap.get('accessCode');
    const session = this.sessionService.getSession();
    const accessCode = queryAccessCode || session?.accessCode || null;

    if (!accessCode) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.enrollmentService.trackAdmission(reference, accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: Admission) => this.application.set(res),
      error: () => this.error.set('Référence ou code d’accès incorrect. Veuillez vérifier vos informations.')
    });
  }

  onSearch() {
    if (!this.searchData.reference || !this.searchData.accessCode) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.enrollmentService.trackAdmission(this.searchData.reference, this.searchData.accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: Admission) => {
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
  readonly ShieldCheck = ShieldCheck;
  readonly LayoutGrid = LayoutGrid;
  readonly Check = Check;
  readonly Sparkles = Sparkles;
}
