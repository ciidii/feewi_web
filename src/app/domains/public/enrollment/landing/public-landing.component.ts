import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, Calendar, Clock, ArrowRight, CheckCircle, 
  Info, Mail, ShieldCheck, Sparkles, Search, RefreshCw, UserCheck, ChefHat, Bus, GraduationCap
} from 'lucide-angular';
import { finalize } from 'rxjs';

import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { EnrollmentPublicService, PublicPortalSummary } from '../../../../core/services/enrollment-public.service';

export type WindowStatus = 'TEASING' | 'OPEN' | 'CLOSED';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss']
})
export class PublicLandingComponent implements OnInit {
  private tenantContext = inject(TenantContextService);
  private sessionService = inject(AdmissionSessionService);
  private enrollmentService = inject(EnrollmentPublicService);
  private router = inject(Router);
  
  tenant = this.tenantContext.activeTenant;
  activeSession = this.sessionService.currentSession;
  hasActiveSession = this.sessionService.hasActiveSession;

  // --- ÉTATS ---
  isLoading = signal(true);
  summary = signal<PublicPortalSummary | null>(null);
  status = signal<WindowStatus>('CLOSED');

  // Recherche rapide (Tracker)
  searchReference = '';

  ngOnInit() {
    this.loadSummary();
  }

  private loadSummary() {
    this.isLoading.set(true);
    this.enrollmentService.getPortalSummary().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.computeStatus(data);
      },
      error: (err) => {
        console.error('[Landing] Error loading summary:', err);
        this.status.set('CLOSED');
      }
    });
  }

  private computeStatus(data: PublicPortalSummary) {
    if (!data.portalActive) {
      this.status.set('CLOSED');
      return;
    }

    // Le backend nous dit directement si on est dans les dates (Section 2.1)
    if (data.withinDates) {
      this.status.set('OPEN');
    } else {
      const now = new Date();
      const start = new Date(data.registrationStartDate);
      this.status.set(now < start ? 'TEASING' : 'CLOSED');
    }
  }

  resetSession() {
    if (confirm('Souhaitez-vous vraiment effacer votre dossier en cours pour en créer un nouveau ?')) {
      this.sessionService.clearSession();
      this.router.navigate(['/enrollment/form-stepper']);
    }
  }

  goToTracker() {
    if (this.searchReference.trim()) {
      this.router.navigate(['/enrollment/tracker', this.searchReference.trim()]);
    }
  }

  isServiceEnabled(code: string): boolean {
    return this.summary()?.enabledServices?.includes(code) || false;
  }

  // Icônes
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly ArrowRight = ArrowRight;
  readonly CheckCircle = CheckCircle;
  readonly Info = Info;
  readonly Mail = Mail;
  readonly ShieldCheck = ShieldCheck;
  readonly Sparkles = Sparkles;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly UserCheck = UserCheck;
  readonly ChefHat = ChefHat;
  readonly Bus = Bus;
  readonly GraduationCap = GraduationCap;
}
