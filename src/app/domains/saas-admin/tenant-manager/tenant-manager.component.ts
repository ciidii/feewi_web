import {Component, computed, inject, LOCALE_ID, OnInit, signal} from '@angular/core';
import {CommonModule, formatDate} from '@angular/common';
import {SchoolService} from '../../../../core/services/school.service';
import {School} from '../../../../core/models/school.model';
import {
  Download,
  Filter,
  Globe,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2
} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DataListComponent} from '../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../shared/models/data-list.models';
import {SchoolFormComponent} from '../components/school-form/school-form.component';
import {FwPageShellComponent} from '../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {FwListCommandBarComponent} from '../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwTab} from '../../../../shared/components/tabs/tabs.component';

@Component({
  selector: 'app-tenant-manager',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatDialogModule,
    DataListComponent,
    FwPageShellComponent,
    FwButtonComponent,
    FwListCommandBarComponent
  ],
  templateUrl: './tenant-manager.component.html',
  styleUrls: ['./tenant-manager.component.scss']
})
export class TenantManagerComponent implements OnInit {
  private schoolService = inject(SchoolService);
  private dialog = inject(MatDialog);
  private locale = inject(LOCALE_ID);

  // Icônes
  readonly Globe = Globe;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;

  // États
  schools = signal<School[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

  activeTabId = signal('Tous');

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    }
    return chips;
  });

  tabs = computed<FwTab[]>(() => [
    { label: 'Tous', id: 'Tous', icon: Globe, count: this.schools().length },
    { label: 'Actifs', id: 'Actifs', icon: ShieldCheck },
    { label: 'En attente', id: 'Preparation', icon: Settings }
  ]);

  // Actions pour les écoles
  readonly schoolActions: RowAction[] = [
    { id: 'edit', label: 'Gérer', icon: Settings, type: 'primary' },
    { id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger' }
  ];

  // Transformation pour le DataList
  displaySchools = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    const schools = this.schools().filter(s => 
      !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
    );

    return schools.map(school => ({
      id: school.id,
      title: school.name,
      subtitle: `ID Technique : ${school.id}`,
      avatarLabel: school.name.substring(0, 2).toUpperCase(),
      date: school.createdAt ? `Créé le ${formatDate(school.createdAt, 'dd/MM/yyyy', this.locale)}` : 'Date inconnue',
      badges: [
        { label: 'PLATFORM', type: 'success' },
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
        this.schools.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onTabChange(tabId: string) {
    this.activeTabId.set(tabId);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') {
      this.openSchoolForm(event.row.rawData);
    }
  }

  openSchoolForm(school?: School) {
    const dialogRef = this.dialog.open(SchoolFormComponent, {
      width: '560px',
      panelClass: 'feewi-dialog-panel',
      data: { school }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSchools();
    });
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
  }

  clearAllFilters() {
    this.searchQuery.set('');
  }
}
