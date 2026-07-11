import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Fingerprint,
  History,
  Key,
  LucideAngularModule,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User,
  UserCog,
  XCircle,
  Zap,
  BookOpen,
  GraduationCap
} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {IdentityService} from '../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../shared/services/loading.service';
import {Staff, User as UserAccount} from '../../../../../core/models/user.model';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {FwInfoCardComponent} from '../../../../../shared/components/info-card/info-card.component';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';
import {firstValueFrom} from 'rxjs';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';
import {AccountFormComponent} from '../user-accounts/components/account-form/account-form.component';

@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    MatDialogModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwBadgeComponent,
    FwInfoCardComponent,
    HasPermissionDirective,
    SkeletonComponent
  ],
  templateUrl: './staff-detail.component.html',
  styleUrls: ['./staff-detail.component.scss']
})
export class StaffDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  protected loadingService = inject(LoadingService);
  private dialog = inject(MatDialog);

  // --- États ---
  staffId = signal<string | null>(null);
  staff = signal<Staff | null>(null);
  userAccount = signal<UserAccount | null>(null);
  isLoading = signal(true);

  // --- Icônes ---
  readonly Fingerprint = Fingerprint;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly UserCog = UserCog;
  readonly Shield = Shield;
  readonly ShieldCheck = ShieldCheck;
  readonly Key = Key;
  readonly Edit = Edit;
  readonly Zap = Zap;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly BookOpen = BookOpen;
  readonly GraduationCap = GraduationCap;

  ngOnInit() {
    this.staffId.set(this.route.snapshot.paramMap.get('id'));
    if (this.staffId()) {
      this.loadStaffData(this.staffId()!);
    } else {
      this.notificationService.error("Identifiant du personnel manquant.");
      this.router.navigate(['/admin/identity/staff']);
    }
  }

  async loadStaffData(id: string) {
    this.isLoading.set(true);
    try {
      // 1. Charger l'identité RH
      const staff = await firstValueFrom(this.identityService.getStaffById(id));
      this.staff.set(staff);

      // 2. Charger le compte utilisateur si existant
      if (staff.hasUserAccount) {
        const userPage = await firstValueFrom(this.identityService.getUsers(staff.email, 0, 1));
        if (userPage.content.length > 0) {
          this.userAccount.set(userPage.content[0]);
        }
      } else {
          this.userAccount.set(null);
      }
    } catch (error) {
      this.notificationService.error("Impossible de charger le dossier collaborateur.");
      this.router.navigate(['/admin/identity/staff']);
    } finally {
      this.isLoading.set(false);
    }
  }

  getAvatarLabel(): string {
    const s = this.staff();
    if (!s) return '??';
    return `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
  }

  getStaffTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      TEACHER: 'Enseignant',
      ADMINISTRATION: 'Personnel Administratif',
      SUPPORT: 'Personnel Support',
      OTHER: 'Autre'
    };
    return labels[type] || type;
  }

  onEditRH() {
    this.notificationService.info("L'édition RH sera bientôt disponible.");
  }

  onManageAccount() {
    const s = this.staff();
    const user = this.userAccount();
    if (!s) return;

    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '560px',
      panelClass: 'feewi-dialog-panel',
      data: { staff: s, user: user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.staffId()) {
        this.loadStaffData(this.staffId()!);
      }
    });
  }

  protected readonly User = User;
  protected readonly History = History;
}
