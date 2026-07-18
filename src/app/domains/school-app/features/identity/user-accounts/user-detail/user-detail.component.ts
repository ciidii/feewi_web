import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {
  Activity,
  Calendar,
  Clock,
  Fingerprint,
  History,
  Key,
  LucideAngularModule,
  Monitor,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Zap,
  Globe,
  Settings,
  Lock,
  ExternalLink
} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AccountFormComponent} from '../components/account-form/account-form.component';
import {MatDialog} from '@angular/material/dialog';
import {FwPageShellComponent} from '../../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../../shared/components/button/button.component';
import {FwInfoCardComponent} from '../../../../../../shared/components/info-card/info-card.component';
import {HasPermissionDirective} from '../../../../../../shared/directives/has-permission.directive';
import {SkeletonComponent} from '../../../../../../shared/components/skeleton/skeleton.component';
import {IdentityService} from '../../../../../../core/services/identity.service';
import {NotificationService} from '../../../../../../shared/services/notification.service';
import {LoadingService} from '../../../../../../shared/services/loading.service';
import {User} from '../../../../../../core/models/user.model';
import {FwTab} from '../../../../../../shared/components/tabs/tabs.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwInfoCardComponent,
    HasPermissionDirective,
    SkeletonComponent
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  protected loadingService = inject(LoadingService);
  private dialog = inject(MatDialog);

  // --- États ---
  userId = signal<string | null>(null);
  user = signal<User | null>(null);
  activeTabId = signal('overview');

  // --- Icônes ---
  readonly Shield = Shield;
  readonly ShieldCheck = ShieldCheck;
  readonly ShieldAlert = ShieldAlert;
  readonly Key = Key;
  readonly Clock = Clock;
  readonly Monitor = Monitor;
  readonly Activity = Activity;
  readonly History = History;
  readonly Globe = Globe;
  readonly UserIcon = UserIcon;
  readonly Settings = Settings;
  readonly Lock = Lock;
  readonly ExternalLink = ExternalLink;
  readonly Fingerprint = Fingerprint;

  // --- Tabs ---
  detailTabs: FwTab[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Shield },
    { id: 'permissions', label: 'Permissions Effectives', icon: Lock },
    { id: 'activity', label: 'Journal d\'accès', icon: History }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loadUserData(id);
    }
  }

  async loadUserData(id: string) {
    this.loadingService.start('component');
    try {
      const user = await firstValueFrom(this.identityService.getUserProfile(id));
      this.user.set(user);
    } catch (error) {
      this.notificationService.error("Impossible de charger les détails du compte.");
      this.router.navigate(['/admin/identity/accounts']);
    } finally {
      this.loadingService.stop();
    }
  }

  onEditAccess() {
    const u = this.user();
    if (!u) return;

    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '560px',
      panelClass: 'feewi-dialog-panel',
      data: { user: u }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadUserData(this.userId()!);
    });
  }

  onResetPassword() {
      this.notificationService.info("Une invitation de réinitialisation a été envoyée par email.");
  }

  toggleStatus() {
      const u = this.user();
      if (!u) return;

      this.identityService.toggleUserActive(u.id!, !u.active).subscribe(() => {
          this.notificationService.success(u.active ? "Compte suspendu" : "Compte activé");
          this.loadUserData(this.userId()!);
      });
  }

  getAvatarLabel(): string {
    return this.user()?.email?.substring(0, 2).toUpperCase() || '??';
  }

  protected readonly Zap = Zap;
}
