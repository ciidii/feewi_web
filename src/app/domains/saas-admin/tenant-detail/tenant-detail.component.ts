import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {
  Activity,
  Building2,
  Calendar,
  CheckCircle,
  Globe,
  GraduationCap,
  History,
  Lock,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  XCircle
} from 'lucide-angular';
import {SchoolService} from '../../../core/services/school.service';
import {School} from '../../../core/models/school.model';
import {NotificationService} from '../../../shared/services/notification.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog';
import {finalize} from 'rxjs';
import {EnrollmentPublicService} from '../../../core/services/enrollment-public.service';
import {PublicPortalSummary} from '../../../core/models/enrollment/dtos';
import {HasPermissionDirective} from '../../../shared/directives/has-permission.directive';
import {FwPageShellComponent} from '../../../shared/components/page-shell/page-shell.component';
import {FwInfoCardComponent} from '../../../shared/components/info-card/info-card.component';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, MatDialogModule, HasPermissionDirective, FwPageShellComponent, FwInfoCardComponent],
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.scss']
})
export class TenantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schoolService = inject(SchoolService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private enrollmentPublicService = inject(EnrollmentPublicService);

  school = signal<School | null>(null);
  enrollmentPortal = signal<PublicPortalSummary | null>(null);
  isLoading = signal(true);
  isActionLoading = signal(false);

  // Icônes
  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Globe = Globe;
  readonly Calendar = Calendar;
  readonly ShieldCheck = ShieldCheck;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Activity = Activity;
  readonly HistoryIcon = History;
  readonly RefreshCw = RefreshCw;
  readonly Lock = Lock;
  readonly GraduationCap = GraduationCap;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSchool(id);
    } else {
      this.notificationService.error("ID d'établissement manquant.");
      this.router.navigate(['/saas/tenants']);
    }
  }

  loadSchool(id: string): void {
    this.isLoading.set(true);
    this.schoolService.getSchoolById(id).subscribe({
      next: (data) => {
        this.school.set(data);
        this.isLoading.set(false);
        if (data.tenantId) {
          this.loadEnrollmentPortal(data.tenantId);
        }
      },
      error: () => {
        this.notificationService.error("Impossible de charger les détails de l'établissement.");
        this.router.navigate(['/saas/tenants']);
        this.isLoading.set(false);
      }
    });
  }

  private loadEnrollmentPortal(tenantId: string): void {
    this.enrollmentPublicService.getPortalSummaryForTenant(tenantId).subscribe({
      next: (summary) => this.enrollmentPortal.set(summary),
      error: () => { /* portail indisponible — carte masquée */ }
    });
  }

  /** Libellé du statut fidèle à SchoolStatus backend (TRIAL | ACTIVE | SUSPENDED). */
  statusLabel(): string {
    switch (this.school()?.status) {
      case 'SUSPENDED': return 'Suspendu';
      case 'TRIAL': return 'Essai';
      default: return 'Actif';
    }
  }

  statusBadgeClass(): string {
    switch (this.school()?.status) {
      case 'SUSPENDED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TRIAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  }

  isSuspended(): boolean {
    return this.school()?.status === 'SUSPENDED';
  }

  yearStateLabel(state: string): string {
    const map: Record<string, string> = { ACTIVE: 'Active', PLANNING: 'Planification', CLOSED: 'Clôturée' };
    return map[state] ?? state;
  }

  yearStateClass(state: string): string {
    const map: Record<string, string> = {
      ACTIVE:   'bg-emerald-50 text-emerald-700 border-emerald-200',
      PLANNING: 'bg-blue-50 text-blue-700 border-blue-200',
      CLOSED:   'bg-slate-100 text-slate-500 border-slate-200'
    };
    return map[state] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  }

  regModeLabel(mode: string): string {
    const map: Record<string, string> = {
      PARENT_ONLY: 'Portail parents', ADMIN_ONLY: 'Guichet seul', BOTH: 'Mixte'
    };
    return map[mode] ?? mode;
  }

  onChangeStatus() {
    const s = this.school();
    if (!s || !s.id) return;

    // Le seul endpoint de mutation super-admin disponible : PATCH /schools/{id}/status.
    const isSuspended = s.status === 'SUSPENDED';
    const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: isSuspended ? 'Réactiver l\'établissement' : 'Suspendre l\'établissement',
        message: `Êtes-vous sûr de vouloir ${isSuspended ? 'réactiver' : 'suspendre'} l'accès pour ${s.name} ?`,
        confirmLabel: isSuspended ? 'Réactiver' : 'Suspendre',
        type: isSuspended ? 'primary' : 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isActionLoading.set(true);
        this.schoolService.updateSchoolStatus(s.id!, newStatus).pipe(
          finalize(() => this.isActionLoading.set(false))
        ).subscribe(() => {
          this.loadSchool(s.id!);
        });
      }
    });
  }

  formatDate(date?: string): string {
    if (!date) return 'Date inconnue';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
