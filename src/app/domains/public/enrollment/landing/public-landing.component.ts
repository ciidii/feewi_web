import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, Clock, ArrowRight, CheckCircle, Info, Mail, ShieldCheck } from 'lucide-angular';
import { TenantContextService } from '../../../../core/services/tenant-context.service';

export type WindowStatus = 'TEASING' | 'OPEN' | 'CLOSED';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './public-landing.component.html',
  styleUrls: ['./public-landing.component.scss']
})
export class PublicLandingComponent implements OnInit, OnDestroy {
  private tenantContext = inject(TenantContextService);
  tenant = this.tenantContext.activeTenant;

  // État de la période d'admission (Mocké pour la démo)
  status = signal<WindowStatus>('OPEN');

  // Dates de la période
  startDate = new Date('2026-04-01');
  endDate = new Date('2026-07-31');

  // Compte à rebours (Mocké : jours restants)
  daysLeft = signal(12);
  private timer: any;

  ngOnInit() {
    // Logique pour mettre à jour le status en fonction de la date actuelle
    this.updateStatus();
    // Simulation d'un rafraîchissement
    this.timer = setInterval(() => this.updateStatus(), 60000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  updateStatus() {
    const now = new Date();
    if (now < this.startDate) {
      this.status.set('TEASING');
    } else if (now > this.endDate) {
      this.status.set('CLOSED');
    } else {
      this.status.set('OPEN');
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
}
