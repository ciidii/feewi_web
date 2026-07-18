import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {Building2, Globe, LucideAngularModule, Plus, Search} from 'lucide-angular';
import {RowAction, TableRow, TabItem} from '../../../shared/models/data-list.models';
import {DataListComponent} from '../../../shared/components/data-list/data-list.component';
import {SchoolService} from '../../../core/services/school.service';
import {School} from '../../../core/models/school.model';
import {HasPermissionDirective} from '../../../shared/directives/has-permission.directive';
import {FwPageShellComponent} from '../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-tenant-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DataListComponent,
    RouterModule,
    HasPermissionDirective,
    FwPageShellComponent
  ],
  templateUrl: './tenant-manager.component.html',
  styleUrls: ['./tenant-manager.component.scss']
})
export class TenantManagerComponent implements OnInit {
  private schoolService = inject(SchoolService);
  private router = inject(Router);

  // Icônes
  readonly Building2 = Building2;
  readonly Globe = Globe;
  readonly Plus = Plus;
  readonly Search = Search;

  // États
  schools = signal<School[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  activeTab = signal('Tous');
  currentPage = signal(0);
  totalPages = signal(1);
  totalTenants = signal(0);

  // Un seul onglet : GET /schools ne supporte que la recherche + pagination,
  // pas de filtrage par statut. On n'affiche donc pas d'onglets décoratifs.
  tenantTabs = computed<TabItem[]>(() => [
    { label: 'Tous', icon: Globe, count: this.totalTenants() }
  ]);

  // Le super-admin ouvre le détail (où se trouve l'action suspendre/activer).
  // Pas d'action "éditer" : aucun endpoint backend d'édition d'école par le super-admin.
  readonly tenantActions: RowAction[] = [
    { id: 'view', label: 'Détails', icon: Search, type: 'primary', permission: 'identity:saas:school:list' }
  ];

  // Transformation des données pour DataList
  tenants = computed<TableRow[]>(() => {
    return this.schools().map(school => {
      const badge = this.statusBadge(school.status);
      return {
        id: school.id || '',
        title: school.name || 'Établissement Sans Nom',
        subtitle: school.tenantId ? `${school.tenantId}.feewi.io` : 'ID non défini',
        avatarLabel: (school.name || '??').substring(0, 2).toUpperCase(),
        date: school.createdAt, // brut (ISO) : le pipe fwDate du tableau le formate
        badges: [
          { label: badge.label, type: badge.type },
          { label: school.educationTemplate || 'SaaS', type: 'info' }
        ],
        rawData: school
      };
    });
  });

  ngOnInit() {
    this.loadSchools();
  }

  /** Badge de statut fidèle à SchoolStatus backend (TRIAL | ACTIVE | SUSPENDED). */
  private statusBadge(status?: string): { label: string; type: 'success' | 'warning' | 'info' } {
    switch (status) {
      case 'SUSPENDED':
        return {label: 'Suspendu', type: 'warning'};
      case 'TRIAL':
        return {label: 'Essai', type: 'info'};
      case 'ACTIVE':
      default:
        return {label: 'Actif', type: 'success'};
    }
  }

  loadSchools() {
    this.isLoading.set(true);
    this.schoolService.getSchools(this.searchQuery(), this.currentPage()).subscribe({
      next: (page) => {
        this.schools.set(page.content);
        this.totalTenants.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onTabChange(tabLabel: string) {
    this.activeTab.set(tabLabel);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(0);
    this.loadSchools();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadSchools();
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'view') {
      this.openDetail(event.row);
    }
  }

  /** Clic sur la ligne entière → ouvre le détail de l'école. */
  handleRowClick(row: TableRow) {
    this.openDetail(row);
  }

  private openDetail(row: TableRow) {
    if (row.id) {
      this.router.navigate(['/saas/tenants', row.id]);
    }
  }
}
