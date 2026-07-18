import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BellRing, Mail, Phone, PartyPopper, LucideAngularModule} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {Router} from '@angular/router';
import {BillingService} from '../../../../../core/services/billing.service';
import {StudentRegistryService} from '../../../../../core/services/student-registry.service';
import {OverdueInstallment} from '../../../../../core/models/billing.model';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwDatePipe} from '../../../../../shared/pipes/fw-date.pipe';

/** Ligne affichée — l'OverdueInstallment enrichi du nom résolu côté student-registry-service. */
interface OverdueRow extends OverdueInstallment {
  studentDisplayName: string;
  registrationNumber?: string;
}

@Component({
  selector: 'app-overdue-installments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwPageShellComponent, FwEmptyStateComponent, FwDatePipe],
  templateUrl: './overdue-installments.component.html',
  styleUrls: ['./overdue-installments.component.scss']
})
export class OverdueInstallmentsComponent implements OnInit {
  private billingService = inject(BillingService);
  private studentRegistryService = inject(StudentRegistryService);
  private router = inject(Router);

  readonly BellRing = BellRing;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly PartyPopper = PartyPopper;

  overdueItems = signal<OverdueInstallment[]>([]);
  studentNames = signal<Map<string, { name: string; registrationNumber?: string }>>(new Map());
  isLoading = signal(true);

  rows = computed<OverdueRow[]>(() => {
    const names = this.studentNames();
    return this.overdueItems()
      .map(item => {
        const resolved = names.get(item.studentId);
        return {
          ...item,
          studentDisplayName: resolved?.name || item.guardianName || 'Élève inconnu',
          registrationNumber: resolved?.registrationNumber
        };
      })
      // Les retards les plus anciens en premier — priorité de relance.
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  });

  ngOnInit() {
    this.loadOverdueInstallments();
  }

  async loadOverdueInstallments() {
    this.isLoading.set(true);
    try {
      const items = await firstValueFrom(this.billingService.getOverdueInstallments());
      this.overdueItems.set(items);
      await this.resolveStudentNames(items);
    } catch {
      // Notification d'erreur déjà déclenchée par BillingService.handleError
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Pas d'endpoint batch côté student-registry-service (limitation connue) : on résout chaque
   * studentId distinct individuellement, en parallèle. Liste attendue petite (une école) donc
   * acceptable — pas de pagination/filtrage nécessaire ici.
   */
  private async resolveStudentNames(items: OverdueInstallment[]) {
    const distinctIds = Array.from(new Set(items.map(i => i.studentId)));
    const results = await Promise.all(
      distinctIds.map(async id => {
        try {
          const student = await firstValueFrom(this.studentRegistryService.getStudentById(id));
          return {id, name: `${student.firstName} ${student.lastName}`.trim(), registrationNumber: student.registrationNumber};
        } catch {
          return {id, name: null, registrationNumber: undefined};
        }
      })
    );

    const map = new Map<string, { name: string; registrationNumber?: string }>();
    for (const r of results) {
      if (r.name) map.set(r.id, {name: r.name, registrationNumber: r.registrationNumber});
    }
    this.studentNames.set(map);
  }

  goToStudent(studentId: string) {
    this.router.navigate(['/admin/registry/students', studentId]);
  }

  isSevere(daysOverdue: number): boolean {
    return daysOverdue > 30;
  }

  formatAmount(value: number): string {
    return `${(value ?? 0).toLocaleString('fr-FR')} FCFA`;
  }
}
