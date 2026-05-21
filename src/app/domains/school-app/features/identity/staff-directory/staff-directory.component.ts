import {Component, computed, inject, LOCALE_ID, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {
  Download,
  Edit,
  Eye,
  Filter,
  Key,
  LucideAngularModule,
  RefreshCw,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users, UserX
} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {IdentityService} from '../../../../../core/services/identity.service';
import {AuthService} from '../../../../../core/services/auth.service';
import {Staff} from '../../../../../core/models/user.model';
import {StaffFormComponent} from './components/staff-form/staff-form.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwTab} from '../../../../../shared/components/tabs/tabs.component';
import {HasPermissionDirective} from '../../../../../shared/directives/has-permission.directive';

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
    FwListCommandBarComponent,
    HasPermissionDirective
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
  readonly Key = Key;
  readonly ShieldAlert = ShieldAlert;

  activeTabId = signal('ALL');
  searchQuery = signal('');

  // Actions PBAC pour le personnel
  readonly staffActions: RowAction[] = [
    {id: 'view', label: 'Voir fiche RH', icon: Eye, type: 'primary', permission: 'identity:user:read'},
    {id: 'edit', label: 'Modifier RH', icon: Edit, type: 'default', permission: 'identity:user:write'},
    {
      id: 'create-account',
      label: 'Ouvrir accès',
      icon: Key,
      type: 'success',
      permission: 'identity:user:write',
      hideIf: (row) => row.metadata?.['hasUserAccount'] === true
    },
    {
      id: 'delete',
      label: 'Supprimer RH',
      icon: Trash2,
      type: 'danger',
      permission: 'identity:user:delete',
      disableIf: (row) => row.metadata?.['isSelf'] === true
    }
  ];

  // Signals connectés au service (StaffPage)
  staffMembers = computed(() => {
    const page = this.identityService.staffPage();
    const currentUser = this.authService.currentUser();
    if (!page || !page.content) return [];

    return page.content
      .filter(staff => {
        const tab = this.activeTabId();
        if (tab === 'ALL') return true;
        if (tab === 'NO_ACCOUNT') return !staff.hasUserAccount;
        return staff.staffType === tab;
      })
      .map(staff => this.mapStaffToRow(staff, currentUser?.staff?.id));
  });

  totalStaff = computed(() => this.identityService.staffPage()?.totalElements || 0);
  isLoading = this.identityService.loading;

  staffTabs = computed<FwTab[]>(() => [
    {label: 'Tous', id: 'ALL', icon: Users, count: this.totalStaff()},
    {label: 'Enseignants', id: 'TEACHER', icon: UserCheck},
    {label: 'Administration', id: 'ADMINISTRATION', icon: Shield},
    {label: 'Sans compte', id: 'NO_ACCOUNT', icon: ShieldAlert}
  ]);

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({key: 'q', label: 'Recherche', value: this.searchQuery()});
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
      case 'edit':
        this.dialog.open(StaffFormComponent, {
          width: '640px',
          panelClass: 'feewi-dialog-panel',
          data: {staff: event.row.rawData, isReadOnly: event.actionId === 'view'}
        });
        break;
      case 'create-account':
        this.dialog.open(StaffFormComponent, {
          width: '640px',
          panelClass: 'feewi-dialog-panel',
          data: {staff: event.row.rawData, forceAccountMode: true}
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

  private mapStaffToRow(staff: Staff, currentStaffId?: string): TableRow {
    const isSelf = staff.id === currentStaffId;

    return {
      id: staff.id || Math.random().toString(),
      title: `${staff.firstName} ${staff.lastName}`,
      subtitle: `${this.getStaffTypeLabel(staff.staffType)} • ${staff.email}`,
      avatarLabel: `${staff.firstName[0]}${staff.lastName[0]}`,
      date: staff.createdAt ? formatDate(staff.createdAt, 'dd/MM/yyyy', this.locale) : 'RH',
      badges: [
        {
          label: staff.staffType,
          type: this.getBadgeTypeForStaff(staff.staffType)
        },
        {
          label: staff.hasUserAccount ? 'AVEC COMPTE' : 'SANS COMPTE',
          type: staff.hasUserAccount ? 'success' : 'warning'
        }
      ],
      metadata: {
        isSelf: isSelf,
        hasUserAccount: staff.hasUserAccount
      },
      rawData: staff
    };
  }

  private getStaffTypeLabel(type: string): string {
    switch (type) {
      case 'TEACHER':
        return 'ENSEIGNANT';
      case 'ADMINISTRATION':
        return 'ADMINISTRATION';
      case 'SUPPORT':
        return 'PERSONNEL SUPPORT';
      default:
        return 'PERSONNEL';
    }
  }

  private getBadgeTypeForStaff(type: string): 'success' | 'info' | 'warning' | 'danger' | 'default' {
    if (type === 'ADMINISTRATION') return 'success';
    if (type === 'TEACHER') return 'info';
    return 'default';
  }
}
