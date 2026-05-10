import {Component, computed, inject, LOCALE_ID, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {RouterModule} from '@angular/router';
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
  styleUrls: ['./tenant-manager.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TenantManagerComponent implements OnInit {
  private schoolService = inject(SchoolService);
  private dialog = inject(MatDialog);
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

  // Configuration des onglets pour le DataList
  tenantTabs = computed<TabItem[]>(() => [
    { label: 'Tous', icon: Globe, count: this.totalTenants() },
    { label: 'Actifs', icon: ShieldCheck },
    { label: 'En préparation', icon: Settings }
  ]);

  // Actions pour les lignes
  readonly tenantActions: RowAction[] = [
    { id: 'edit', label: 'Gérer', icon: Settings, type: 'primary' },
    { id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger' }
  ];

  // Transformation pour le DataList (renommé en tenants pour le template)
  tenants = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    const schools = this.schools().filter(s => {
      const matchQuery = !query || 
                        (s.name || '').toLowerCase().includes(query) || 
                        (s.id || '').toLowerCase().includes(query);
      
      if (this.activeTab() === 'Actifs') return matchQuery && s.active;
      if (this.activeTab() === 'En préparation') return matchQuery && !s.active;
      
      return matchQuery;
    });

    return schools.map(school => ({
      id: school.id || Math.random().toString(),
      title: school.name || 'Établissement Sans Nom',
      subtitle: `ID Technique : ${school.id}`,
      avatarLabel: (school.name || '??').substring(0, 2).toUpperCase(),
      date: school.createdAt ? formatDate(school.createdAt, 'dd/MM/yyyy', this.locale) : 'Date inconnue',
      badges: [
        { label: school.active ? 'ACTIF' : 'PRÉPARATION', type: school.active ? 'success' : 'warning' },
        { label: 'SaaS', type: 'info' }
      ],
      rawData: school
    }));
  });

  ngOnInit() {
    this.loadSchools();
  }

  async loadSchools() {
    this.isLoading.set(true);
    this.schoolService.getSchools().subscribe({
      next: (data) => {
        // Le service renvoie un tableau de School, pas une Page pour le moment selon AcademicService pattern
        // Mais l'erreur disait "Argument of type Page<School> is not assignable to parameter of type School[]"
        // Donc le backend semble renvoyer une Page.
        const page = data as any;
        if (page && page.content) {
          this.schools.set(page.content);
          this.totalTenants.set(page.totalElements || page.content.length);
          this.totalPages.set(page.totalPages || 1);
        } else if (Array.isArray(data)) {
          this.schools.set(data);
          this.totalTenants.set(data.length);
          this.totalPages.set(1);
        }
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
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadSchools();
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') {
      // Navigation vers le détail pour la gestion
      // this.router.navigate(['/saas/tenants', event.row.id]);
    }
  }
}
