import {Component, computed, inject, LOCALE_ID, OnInit, signal} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {Globe, LucideAngularModule, Plus, RefreshCw, Settings, ShieldCheck, Trash2, Search} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {RowAction, TableRow, TabItem} from '../../../shared/models/data-list.models';
import {DataListComponent} from '../../../shared/components/data-list/data-list.component';
import {SchoolService} from '../../../core/services/school.service';
import {School} from '../../../core/models/school.model';

@Component({
  selector: 'app-tenant-manager',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatDialogModule,
    DataListComponent,
    RouterModule
  ],
  templateUrl: './tenant-manager.component.html',
  styleUrls: ['./tenant-manager.component.scss']
})
export class TenantManagerComponent implements OnInit {
  private schoolService = inject(SchoolService);
  private router = inject(Router);
  private locale = inject(LOCALE_ID);

  // Icônes
  readonly Globe = Globe;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly ShieldCheck = ShieldCheck;
  readonly Search = Search;

  // États
  schools = signal<School[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  activeTab = signal('Tous');
  currentPage = signal(0);
  totalPages = signal(1);
  totalTenants = signal(0);

  // Configuration des onglets
  tenantTabs = computed<TabItem[]>(() => [
    { label: 'Tous', icon: Globe, count: this.totalTenants() },
    { label: 'Actifs', icon: ShieldCheck },
    { label: 'En préparation', icon: Settings }
  ]);

  // Actions
  readonly tenantActions: RowAction[] = [
    { id: 'view', label: 'Détails', icon: Search, type: 'primary' },
    { id: 'edit', label: 'Modifier', icon: Settings, type: 'default' }
  ];

  // Transformation des données pour DataList
  tenants = computed<TableRow[]>(() => {
    return this.schools().map(school => ({
      id: school.id || '',
      title: school.name || 'Établissement Sans Nom',
      subtitle: school.tenantId ? `${school.tenantId}.feewi.io` : 'ID non défini',
      avatarLabel: (school.name || '??').substring(0, 2).toUpperCase(),
      date: school.createdAt ? formatDate(school.createdAt, 'dd/MM/yyyy', this.locale) : 'Date inconnue',
      badges: [
        { label: (school.status === 'ACTIVE' || school.active !== false) ? 'ACTIF' : 'SUSPENDU', 
          type: (school.status === 'ACTIVE' || school.active !== false) ? 'success' : 'warning' },
        { label: school.educationTemplate || 'SaaS', type: 'info' }
      ],
      rawData: school
    }));
  });

  ngOnInit() {
    this.loadSchools();
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
    // Note: Si le backend supporte le filtrage par status, on pourrait recharger ici.
    // Pour l'instant on garde le filtrage simple ou on recharge tout.
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
    if (event.actionId === 'view' || event.actionId === 'edit') {
      this.router.navigate(['/saas/tenants', event.row.id]);
    }
  }
}
