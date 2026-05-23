import {Component, computed, inject, LOCALE_ID, OnInit, signal} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {
  Download,
  Edit,
  History,
  Key,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UserX,
  Zap
} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {IdentityService} from '../../../../../core/services/identity.service';
import {AuthService} from '../../../../../core/services/auth.service';
import {User} from '../../../../../core/models/user.model';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {NotificationService} from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-user-account-list',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatDialogModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwListCommandBarComponent,
    DataListComponent
  ],
  templateUrl: './user-account-list.component.html',
  styleUrl: './user-account-list.component.scss'
})
export class UserAccountListComponent implements OnInit {
  private identityService = inject(IdentityService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private locale = inject(LOCALE_ID);

  // Icônes
  readonly Shield = Shield;
  readonly Key = Key;
  readonly ShieldCheck = ShieldCheck;
  readonly ShieldAlert = ShieldAlert;
  readonly RefreshCw = RefreshCw;
  readonly Search = Search;
  readonly UserX = UserX;
  readonly UserCheck = UserCheck;
  readonly Edit = Edit;
  readonly Zap = Zap;

  // État UI
  activeTabId = signal('ALL');
  searchQuery = signal('');

  // Actions PBAC
  readonly accountActions: RowAction[] = [
    { id: 'edit', label: 'Modifier accès', icon: Edit, type: 'default', permission: 'identity:user:write' },
    {
        id: 'toggle-active',
        label: (row) => row.metadata?.['active'] ? 'Suspendre' : 'Réactiver',
        icon: (row) => row.metadata?.['active'] ? UserX : UserCheck,
        type: (row) => row.metadata?.['active'] ? 'danger' : 'success',
        permission: 'identity:user:write',
        disableIf: (row) => row.metadata?.['isSelf'] === true
    },
    { id: 'reset-pwd', label: 'Réinitialiser mot de passe', icon: Key, type: 'default', permission: 'identity:user:write' },
    { id: 'audit', label: 'Voir logs', icon: History, type: 'default', permission: 'identity:audit:read' }
  ];

  // Signals connectés
  users = computed(() => {
    const page = this.identityService.userPage();
    const currentUser = this.authService.currentUser();
    if (!page || !page.content) return [];

    return page.content
      .filter(user => {
        const tab = this.activeTabId();
        if (tab === 'ALL') return true;
        if (tab === 'ACTIVE') return user.active;
        if (tab === 'SUSPENDED') return !user.active;
        return true;
      })
      .map(user => this.mapUserToRow(user, currentUser?.id));
  });

  isLoading = this.identityService.loading;
  totalUsers = computed(() => this.identityService.userPage()?.totalElements || 0);

  accountTabs = computed<FwTab[]>(() => [
    { label: 'Tous les comptes', id: 'ALL', icon: Shield, count: this.totalUsers() },
    { label: 'Actifs', id: 'ACTIVE', icon: ShieldCheck },
    { label: 'Suspendus', id: 'SUSPENDED', icon: ShieldAlert }
  ]);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(search: string = '') {
    this.identityService.getUsers(search).subscribe();
  }

  onTabChange(tabId: string) {
    this.activeTabId.set(tabId);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.loadUsers(query);
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    const user = event.row.rawData as User;

    switch (event.actionId) {
      case 'toggle-active':
        this.identityService.toggleUserActive(user.id!, !user.active).subscribe(() => {
          this.notificationService.success(user.active ? 'Compte suspendu' : 'Compte réactivé');
          this.loadUsers(this.searchQuery());
        });
        break;
      case 'edit':
        // TODO: Ouvrir AccountForm
        break;
      case 'reset-pwd':
        this.notificationService.info('Fonctionnalité en cours de déploiement');
        break;
    }
  }

  private mapUserToRow(user: User, currentUserId?: string): TableRow {
    const isSelf = user.id === currentUserId;
    const staffName = user.staff ? `${user.staff.firstName} ${user.staff.lastName}` : 'Compte Système';

    return {
      id: user.id || '',
      title: user.email,
      subtitle: `${staffName} • ${user.roles.join(', ').replace(/ROLE_/g, '')}`,
      avatarLabel: user.email.substring(0, 2).toUpperCase(),
      date: user.lastLoginAt ? formatDate(user.lastLoginAt, 'short', this.locale) : 'Jamais connecté',
      badges: [
        {
            label: user.active ? 'ACTIF' : 'SUSPENDU',
            type: user.active ? 'success' : 'danger'
        },
        {
            label: user.forceChangePassword ? 'PWD REQUIS' : '',
            type: 'warning',
            hide: !user.forceChangePassword
        }
      ],
      metadata: {
        isSelf: isSelf,
        active: user.active
      },
      rawData: user
    };
  }
}
