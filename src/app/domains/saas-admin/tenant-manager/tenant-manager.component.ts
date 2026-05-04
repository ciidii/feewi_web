import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {Router, RouterModule} from '@angular/router';
import {DataListComponent} from '../../../shared/components/data-list/data-list.component';
import {RowAction, TabItem, TableRow} from '../../../shared/models/data-list.models';
import {Activity, Building2, Eye, Globe, LucideAngularModule, Plus, ShieldCheck, Trash2} from 'lucide-angular';
import {TenantFormComponent} from '../tenant-form/tenant-form.component';
import {TenantEditFormComponent} from '../tenant-edit-form/tenant-edit-form.component';
import {SchoolService} from '../../../core/services/school.service';
import {School} from '../../../core/models/school.model';
import {NotificationService} from '../../../shared/services/notification.service';

@Component({
  selector: 'app-tenant-manager',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule, MatDialogModule, RouterModule],
  templateUrl: './tenant-manager.component.html',
  styleUrl: './tenant-manager.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class TenantManagerComponent implements OnInit {
  private dialog = inject(MatDialog);
  private schoolService = inject(SchoolService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  readonly ShieldCheck = ShieldCheck;
  readonly Plus = Plus;

  activeTab = signal('Tous');
  searchQuery = signal('');
  currentPage = signal(0);
  readonly pageSize = 10;

  // Actions dynamiques pour les établissements
  readonly tenantActions: RowAction[] = [
    { id: 'edit', label: 'Détails & Edition', icon: Eye, type: 'primary' },
    { id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger' }
  ];

  readonly schoolsPage = this.schoolService.schoolsPage;
  readonly totalTenants = computed(() => this.schoolsPage()?.totalElements || 0);
  readonly totalPages = computed(() => this.schoolsPage()?.totalPages || 1);
  readonly isLoading = this.schoolService.loading;

  readonly tenantTabs = computed<TabItem[]>(() => {
    const schools = this.schoolsPage()?.content || [];
    const activeCount = schools.filter((school) => school.active !== false).length;
    const pendingCount = schools.filter((school) => school.active === false).length;

    return [
      { label: 'Tous', icon: Building2, count: this.totalTenants() },
      { label: 'Actifs', icon: Activity, count: activeCount },
      { label: 'En attente', icon: Globe, count: pendingCount }
    ];
  });

  readonly tenants = computed<TableRow[]>(() => {
    const schools = this.filteredSchools();
    return schools.map((school) => this.mapSchoolToRow(school));
  });

  readonly filteredSchools = computed<School[]>(() => {
    const schools = this.schoolsPage()?.content || [];
    const tab = this.activeTab();
    if (tab === 'Actifs') {
      return schools.filter((school) => school.active !== false);
    }
    if (tab === 'En attente') {
      return schools.filter((school) => school.active === false);
    }
    return schools;
  });

  ngOnInit(): void {
    this.loadSchools();
  }

  loadSchools(search: string = this.searchQuery()): void {
    this.searchQuery.set(search);
    this.schoolService.getSchools(search, this.currentPage(), this.pageSize).subscribe();
  }

  openCreateModal() {
    const dialogRef = this.dialog.open(TenantFormComponent, {
      width: '850px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSchools(this.searchQuery());
      }
    });
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }

  onSearch(query: string) {
    this.currentPage.set(0);
    this.loadSchools(query);
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadSchools();
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    switch (event.actionId) {
      case 'edit':
        // Navigation vers la page de détails au lieu de la modale pour une vue complète
        this.router.navigate(['/saas/tenants', event.row.id]);
        break;
      case 'delete':
        this.notificationService.info('La suppression sera disponible bientôt.', 'Fonctionnalité SaaS');
        break;
    }
  }

  private openEditModal(row: TableRow) {
    const school = row.rawData as School | undefined;
    if (!school) {
      this.notificationService.error("Impossible d'ouvrir le formulaire de modification.");
      return;
    }

    const dialogRef = this.dialog.open(TenantEditFormComponent, {
      width: '580px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: school
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadSchools(this.searchQuery());
      }
    });
  }

  private mapSchoolToRow(school: School): TableRow {
    const isActive = school.active !== false;
    return {
      id: school.id || school.tenantId,
      title: school.name,
      subtitle: `${school.tenantId} • ${school.city}`,
      avatarLabel: this.getAvatarLabel(school.name),
      date: school.createdAt ? `Cree le ${new Date(school.createdAt).toLocaleDateString()}` : 'Date inconnue',
      badges: [
        {
          label: isActive ? 'ACTIVE' : 'INACTIVE',
          type: isActive ? 'info' : 'warning'
        }
      ],
      rawData: school
    };
  }

  private getAvatarLabel(name: string): string {
    const words = name.trim().split(/\s+/).slice(0, 2);
    if (words.length === 0) return 'ET';
    return words.map((word) => word.charAt(0).toUpperCase()).join('');
  }
}
