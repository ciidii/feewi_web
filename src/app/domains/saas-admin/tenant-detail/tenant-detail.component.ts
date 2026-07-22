import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {
  Activity,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  Globe,
  GraduationCap,
  History,
  Lock,
  LucideAngularModule,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wallet,
  XCircle
} from 'lucide-angular';
import {SchoolService} from '../../../core/services/school.service';
import {SubscriptionService} from '../../../core/services/subscription.service';
import {School} from '../../../core/models/school.model';
import {Subscription} from '../../../core/models/subscription.model';
import {SubscriptionPaymentFormComponent} from '../subscription-payment-form/subscription-payment-form.component';
import {NotificationService} from '../../../shared/services/notification.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog';
import {TenantEditFormComponent} from '../tenant-edit-form/tenant-edit-form.component';
import {finalize} from 'rxjs';
import {EnrollmentPublicService} from '../../../core/services/enrollment-public.service';
import {PublicPortalSummary} from '../../../core/models/enrollment/dtos';
import {HasPermissionDirective} from '../../../shared/directives/has-permission.directive';
import {FwPageShellComponent} from '../../../shared/components/page-shell/page-shell.component';
import {FwInfoCardComponent} from '../../../shared/components/info-card/info-card.component';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, MatDialogModule, MatMenuModule, HasPermissionDirective, FwPageShellComponent, FwInfoCardComponent],
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.scss']
})
export class TenantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schoolService = inject(SchoolService);
  private subscriptionService = inject(SubscriptionService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private enrollmentPublicService = inject(EnrollmentPublicService);

  school = signal<School | null>(null);
  enrollmentPortal = signal<PublicPortalSummary | null>(null);
  subscription = signal<Subscription | null>(null);
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
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly MoreVertical = MoreVertical;
  readonly CreditCard = CreditCard;
  readonly Wallet = Wallet;

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
        this.loadSubscription(id);
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

  private loadSubscription(schoolId: string): void {
    this.subscription.set(null);
    this.subscriptionService.getSubscription(schoolId).subscribe({
      next: (sub) => this.subscription.set(sub),
      error: () => { /* abonnement non provisionné — carte masquée */ }
    });
  }

  /** Libellés & styles du statut d'abonnement (miroir de SubscriptionStatus backend). */
  subStatusLabel(status?: string): string {
    switch (status) {
      case 'TRIAL': return 'Essai';
      case 'ACTIVE': return 'À jour';
      case 'PAST_DUE': return 'Impayé';
      case 'SUSPENDED': return 'Suspendu';
      case 'CANCELLED': return 'Résilié';
      default: return status ?? '—';
    }
  }

  subStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TRIAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PAST_DUE': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'SUSPENDED': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  planLabel(plan?: string): string {
    return plan === 'ANNUAL' ? 'Annuel' : 'Mensuel';
  }

  /** Ouvre le dialogue d'enregistrement d'un paiement d'abonnement. */
  onRecordPayment(): void {
    const s = this.school();
    const sub = this.subscription();
    if (!s || !s.id || !sub) return;

    const ref = this.dialog.open(SubscriptionPaymentFormComponent, {
      autoFocus: false,
      panelClass: 'fw-dialog',
      data: {schoolId: s.id, schoolName: s.name, amount: sub.amount, currency: sub.currency}
    });
    ref.afterClosed().subscribe(payment => {
      if (payment) {
        this.notificationService.success(`Paiement enregistré — reçu ${payment.receiptNumber}.`);
        this.loadSchool(s.id!);
      }
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

  /**
   * Transitions de statut valides depuis l'état courant (PATCH /schools/{id}/status
   * accepte ACTIVE | SUSPENDED | TRIAL). Une école en essai peut être activée ou suspendue.
   */
  statusTransitions(): { target: 'ACTIVE' | 'SUSPENDED' | 'TRIAL'; label: string; icon: any; kind: 'primary' | 'danger' }[] {
    switch (this.school()?.status) {
      case 'TRIAL':
        return [
          {target: 'ACTIVE', label: 'Activer', icon: this.CheckCircle, kind: 'primary'},
          {target: 'SUSPENDED', label: 'Suspendre', icon: this.XCircle, kind: 'danger'}
        ];
      case 'SUSPENDED':
        return [{target: 'ACTIVE', label: 'Réactiver', icon: this.CheckCircle, kind: 'primary'}];
      case 'ACTIVE':
      default:
        return [{target: 'SUSPENDED', label: 'Suspendre', icon: this.XCircle, kind: 'danger'}];
    }
  }

  changeStatus(target: 'ACTIVE' | 'SUSPENDED' | 'TRIAL') {
    const s = this.school();
    if (!s || !s.id) return;

    const verbs: Record<string, { title: string; verb: string; confirm: string; type: string }> = {
      ACTIVE: {title: "Activer l'établissement", verb: 'activer', confirm: 'Activer', type: 'primary'},
      SUSPENDED: {title: "Suspendre l'établissement", verb: 'suspendre', confirm: 'Suspendre', type: 'danger'},
      TRIAL: {title: "Repasser en essai", verb: 'repasser en essai', confirm: 'Confirmer', type: 'primary'}
    };
    const v = verbs[target];

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: v.title,
        message: `Êtes-vous sûr de vouloir ${v.verb} l'accès pour ${s.name} ?`,
        confirmLabel: v.confirm,
        type: v.type
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isActionLoading.set(true);
        this.schoolService.updateSchoolStatus(s.id!, target).pipe(
          finalize(() => this.isActionLoading.set(false))
        ).subscribe(() => {
          this.loadSchool(s.id!);
        });
      }
    });
  }

  onEdit() {
    const s = this.school();
    if (!s) return;
    const ref = this.dialog.open(TenantEditFormComponent, {data: s, autoFocus: false, panelClass: 'fw-dialog'});
    ref.afterClosed().subscribe(updated => {
      if (updated) this.loadSchool(s.id!);
    });
  }

  onDelete() {
    const s = this.school();
    if (!s || !s.id) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: "Supprimer l'établissement",
        message: `Cette action supprime définitivement « ${s.name} » et tous ses comptes (utilisateurs, personnel, rôles). Elle est irréversible. Continuer ?`,
        confirmLabel: 'Supprimer définitivement',
        type: 'danger'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isActionLoading.set(true);
        this.schoolService.deleteSchool(s.id!).pipe(
          finalize(() => this.isActionLoading.set(false))
        ).subscribe(() => this.router.navigate(['/saas/tenants']));
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
