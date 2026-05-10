import {Component, computed, inject, LOCALE_ID, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {
  Archive,
  Download,
  Edit,
  Eye,
  Filter,
  LucideAngularModule,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX
} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {IdentityService} from '../../../../../core/services/identity.service';
import {AuthService} from '../../../../../core/services/auth.service';
import {User} from '../../../../../core/models/user.model';
import {StaffFormComponent} from './components/staff-form/staff-form.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  imports: [
    CommonModule,
    DataListComponent,
    LucideAngularModule,
    MatDialogModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwListCommandBarComponent
  ],
  templateUrl: './staff-directory.component.html',
  styleUrl: './staff-directory.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StaffDirectoryComponent implements OnInit {
  private identityService = inject(IdentityService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private locale = inject(LOCALE_ID);

  // Icônes
  readonly UserPlus = UserPlus;
  readonly Filter = Filter;
  readonly Download = Download;
  readonly RefreshCw = RefreshCw;
  readonly Users = Users;
  readonly Shield = Shield;
  readonly UserCheck = UserCheck;
  readonly UserX = UserX;

  activeTabId = signal('Tous');
  searchQuery = signal('');

  // Actions dynamiques pour le personnel
  readonly staffActions: RowAction[] = [
    { id: 'view', label: 'Voir profil', icon: Eye, type: 'primary' },
    {
      id: 'edit',
      label: 'Modifier',
      icon: Edit,
      type: 'primary',
      disableIf: (row) => row.metadata?.['isSelf'] === true
    },
    {
      id: 'delete',
      label: 'Désactiver',
      icon: Trash2,
      type: 'danger',
      disableIf: (row) => row.metadata?.['isSelf'] === true
    }
  ];

  // Signals connectés au service
  staffMembers = computed(() => {
    const page = this.identityService.staffPage();
    const currentUser = this.authService.currentUser();
    if (!page) return [];
    
    return page.content
      .filter(user => {
        if (this.activeTabId() === 'Administrateurs') return user.roles.some(r => r.includes('ADMIN'));
        if (this.activeTabId() === 'Enseignants') return user.roles.some(r => r.includes('TEACHER'));
        if (this.activeTabId() === 'Inactifs') return user.active === false;
        return true;
      })
      .map(user => this.mapUserToRow(user, currentUser?.id));
  });

  totalStaff = computed(() => this.identityService.staffPage()?.totalElements || 0);
  isLoading = this.identityService.loading;

  staffTabs = computed<FwTab[]>(() => [
    { label: 'Tous', id: 'Tous', icon: Users, count: this.totalStaff() },
    { label: 'Administrateurs', id: 'Administrateurs', icon: Shield },
    { label: 'Enseignants', id: 'Enseignants', icon: UserCheck },
    { label: 'Inactifs', id: 'Inactifs', icon: UserX }
  ]);

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    }
    return chips;
  });

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff(search: string = '') {
    this.identityService.getStaff(search).subscribe();
  }

  onTabChange(tabId: string) {
    this.activeTabId.set(tabId);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.loadStaff(query);
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    switch (event.actionId) {
      case 'view':
        this.dialog.open(StaffFormComponent, {
          width: '640px',
          data: { user: event.row.rawData, isReadOnly: true }
        });
        break;
      case 'edit':
        this.dialog.open(StaffFormComponent, {
          width: '640px',
          data: { user: event.row.rawData }
        });
        break;
    }
  }

  openAddStaffForm() {
    const dialogRef = this.dialog.open(StaffFormComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStaff();
      }
    });
  }

  removeFilter(key: string) {
    if (key === 'q') {
      this.searchQuery.set('');
      this.loadStaff('');
    }
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.loadStaff('');
  }

  private mapUserToRow(user: User, currentUserId?: string): TableRow {
    const isSelf = user.id === currentUserId;

    return {
      id: user.id || Math.random().toString(),
      title: `${user.firstName} ${user.lastName}`,
      subtitle: `${user.roles[0]?.replace('ROLE_', '') || 'EMPLOYÉ'} • ${user.email}`,
      avatarLabel: `${user.firstName[0]}${user.lastName[0]}`,
      date: user.createdAt ? formatDate(user.createdAt, 'dd/MM/yyyy', this.locale) : 'Date inconnue',
      badges: user.roles.map(role => ({
        label: role.replace('ROLE_', ''),
        type: this.getBadgeTypeForRole(role)
      })),
      metadata: {
        isSelf: isSelf,
        lastLoginAt: user.lastLoginAt,
        connectionCount: user.connectionCount
      },
      rawData: user
    };
  }

  private getBadgeTypeForRole(role: string): 'success' | 'info' | 'warning' | 'danger' | 'default' {
    if (role.includes('ADMIN')) return 'success';
    if (role.includes('TEACHER')) return 'info';
    if (role.includes('SECRETARY')) return 'warning';
    return 'default';
  }
}
