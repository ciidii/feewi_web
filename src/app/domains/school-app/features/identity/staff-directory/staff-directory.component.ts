import { Component, signal, computed, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, UserPlus, Shield, Filter, Download, Users, UserCheck, UserX } from 'lucide-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { TabItem, TableRow } from '../../../../../shared/models/data-list.models';
import { IdentityService } from '../../../../../core/services/identity.service';
import { User } from '../../../../../core/models/user.model';
import { StaffFormComponent } from './components/staff-form/staff-form.component';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule, MatDialogModule],
  templateUrl: './staff-directory.component.html',
  styleUrl: './staff-directory.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StaffDirectoryComponent implements OnInit {
  private identityService = inject(IdentityService);
  private dialog = inject(MatDialog);

  readonly UserPlus = UserPlus;
  readonly Filter = Filter;
  readonly Download = Download;

  activeTab = signal('Tous');
  
  // Signals connectés au service
  staffMembers = computed(() => {
    const page = this.identityService.staffPage();
    if (!page) return [];
    return page.content.map(user => this.mapUserToRow(user));
  });

  totalStaff = computed(() => this.identityService.staffPage()?.totalElements || 0);
  isLoading = this.identityService.loading;

  staffTabs: TabItem[] = [
    { label: 'Tous', icon: Users, count: 0 },
    { label: 'Administrateurs', icon: Shield, count: 0 },
    { label: 'Enseignants', icon: UserCheck, count: 0 },
    { label: 'Inactifs', icon: UserX, count: 0 }
  ];

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff(search: string = '') {
    this.identityService.getStaff(search);
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }

  onSearch(query: string) {
    this.loadStaff(query);
  }

  openAddStaffForm() {
    const dialogRef = this.dialog.open(StaffFormComponent, {
      width: '640px',
      maxWidth: '95vw',
      panelClass: 'staff-form-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStaff();
      }
    });
  }

  private mapUserToRow(user: User): TableRow {
    return {
      id: user.id || Math.random().toString(),
      title: `${user.firstName} ${user.lastName}`,
      subtitle: `${user.roles[0]?.replace('ROLE_', '') || 'EMPLOYÉ'} • ${user.email}`,
      avatarLabel: `${user.firstName[0]}${user.lastName[0]}`,
      date: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Date inconnue',
      badges: user.roles.map(role => ({
        label: role.replace('ROLE_', ''),
        type: this.getBadgeTypeForRole(role)
      }))
    };
  }

  private getBadgeTypeForRole(role: string): 'success' | 'info' | 'warning' | 'danger' | 'default' {
    if (role.includes('ADMIN')) return 'success';
    if (role.includes('TEACHER')) return 'info';
    if (role.includes('SECRETARY')) return 'warning';
    return 'default';
  }
}
