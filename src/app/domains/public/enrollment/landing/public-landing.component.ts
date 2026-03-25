import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Calendar, Clock, ArrowRight, CheckCircle, Info, Mail, ShieldCheck, Sparkles, Search, RefreshCw, UserCheck } from 'lucide-angular';

import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { AdmissionSessionService } from '../../../../core/services/admission-session.service';
import { AcademicService } from '../../../../core/services/academic.service';
import { AcademicYear } from '../../../../core/models/academic.model';

export type WindowStatus = 'TEASING' | 'OPEN' | 'CLOSED';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss']
})
export class PublicLandingComponent implements OnInit, OnDestroy {
  private tenantContext = inject(TenantContextService);
  private sessionService = inject(AdmissionSessionService);
  private academicService = inject(AcademicService);
  private router = inject(Router);
  
  tenant = this.tenantContext.activeTenant;
  activeSession = this.sessionService.currentSession;
  hasActiveSession = this.sessionService.hasActiveSession;

  // État de la période d'admission (Mocké pour la démo)
  status = signal<WindowStatus>('OPEN');
  activeYear = signal<AcademicYear | null>(null);

  // Recherche rapide (Tracker)
  searchReference = '';

  // Dates de la période (Exemple)
  startDate = new Date('2026-04-01');
  endDate = new Date('2026-07-31');

  private timer: any;

  async ngOnInit() {
    this.updateStatus();
    this.timer = setInterval(() => this.updateStatus(), 60000);
    
    try {
      const year = await this.academicService.getCurrentYear();
      this.activeYear.set(year);
    } catch (e) {
      console.warn('Impossible de charger l\'année active sur le hub');
    }
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  updateStatus() {
    const now = new Date();
    // En production, cette info viendrait du service de config (EnrollmentConfig)
    if (now < this.startDate) {
      this.status.set('TEASING');
    } else if (now > this.endDate) {
      this.status.set('CLOSED');
    } else {
      this.status.set('OPEN');
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
}
