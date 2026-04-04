import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft, Building2, Mail, Phone, MapPin,
  Globe, Calendar, ShieldCheck, CheckCircle,
  XCircle, Edit, Trash2, Printer, MoreVertical,
  Activity, Users, CreditCard, History, ChevronRight,
  User, ExternalLink, RefreshCw
} from 'lucide-angular';
import { SchoolService } from '../../../core/services/school.service';
import { School } from '../../../core/models/school.model';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { finalize } from 'rxjs';

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

  school = signal<School | null>(null);
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
  readonly History = History;
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
      },
      error: (err) => {
        this.notificationService.error("Impossible de charger les détails de l'établissement.");
        this.router.navigate(['/saas/tenants']);
        this.isLoading.set(false);
      }
    });
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
}
