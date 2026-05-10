import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Edit,
  ExternalLink,
  Globe,
  GraduationCap,
  History,
  Lock,
  LucideAngularModule,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Printer,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  Users,
  XCircle
} from 'lucide-angular';
import {SchoolService} from '../../../core/services/school.service';
import {School} from '../../../core/models/school.model';
import {NotificationService} from '../../../shared/services/notification.service';
import {AuthService} from '../../../core/services/auth.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../../shared/components/confirm-dialog/confirm-dialog';
import {finalize} from 'rxjs';
import {EnrollmentPublicService} from '../../../core/services/enrollment-public.service';
import {PublicPortalSummary} from '../../../core/models/enrollment/dtos';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, MatDialogModule],
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.scss']
})
export class TenantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schoolService = inject(SchoolService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private enrollmentPublicService = inject(EnrollmentPublicService);

  school = signal<School | null>(null);
  enrollmentPortal = signal<PublicPortalSummary | null>(null);
  isLoading = signal(true);
  isActionLoading = signal(false);

  // Icônes
  readonly ArrowLeft = ArrowLeft;
  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Globe = Globe;
  readonly Calendar = Calendar;
  readonly ShieldCheck = ShieldCheck;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Printer = Printer;
  readonly MoreVertical = MoreVertical;
  readonly Activity = Activity;
  readonly Users = Users;
  readonly CreditCard = CreditCard;
  readonly HistoryIcon = History;
  readonly ChevronRight = ChevronRight;
  readonly User = User;
  readonly ExternalLink = ExternalLink;

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

  async onImpersonate() {
    const s = this.school();
    if (!s || !s.tenantId) return;

    // Dans une implémentation réelle, nous devrions avoir l'ID de l'admin
    // Pour l'instant, nous affichons un message d'information
    this.notificationService.info(`Tentative de connexion en tant qu'administrateur de ${s.name}...`);

    // Simulation: si nous avions l'ID de l'utilisateur admin
    // this.authService.impersonate(adminUserId).subscribe(...)
    this.notificationService.warning("L'identifiant de l'administrateur est requis pour cette action.");
  }

  onChangeStatus() {
    const s = this.school();
    if (!s || !s.id) return;

    const isCurrentlyActive = s.status === 'ACTIVE' || s.active !== false;
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: isCurrentlyActive ? 'Suspendre l\'établissement' : 'Réactiver l\'établissement',
        message: `Êtes-vous sûr de vouloir ${isCurrentlyActive ? 'suspendre' : 'réactiver'} l'accès pour ${s.name} ?`,
        confirmLabel: isCurrentlyActive ? 'Suspendre' : 'Réactiver',
        type: isCurrentlyActive ? 'danger' : 'primary'
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

  onEdit() {
    // Cette partie pourrait ouvrir la modale d'édition existante
    this.notificationService.info("Redirection vers le formulaire d'édition...");
  }

  formatDate(date?: string): string {
    if (!date) return 'Date inconnue';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  protected readonly RefreshCw = RefreshCw;
  protected readonly Lock = Lock;
  protected readonly GraduationCap = GraduationCap;
}
