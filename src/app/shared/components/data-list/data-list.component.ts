import {Component, computed, input, model, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatMenuModule} from '@angular/material/menu';
import {
  Archive,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Inbox,
  Layers,
  LayoutGrid,
  LucideAngularModule,
  Search,
  Sparkles,
  Table,
  Trash2,
  X
} from 'lucide-angular';

// Importer les modèles
import {
  RowAction,
  SearchState,
  SelectionState,
  TabItem,
  TableRow,
  ViewConfig,
  ViewMode
} from '../../models/data-list.models';

// Importer les composants
import {ExpandableViewComponent} from './views/expandable-view/expandable-view';
import {CardsViewComponent} from './views/cards-view/cards-view';
import {SortState, TableViewComponent} from './views/table-view/table-view';
import {TimelineViewComponent} from './views/timeline-view/timeline-view';
import {CardSkeletonComponent} from '../skeleton/card-skeleton.component';
import {BlockLoaderComponent} from '../loader/block-loader.component';
import {FwEmptyStateComponent} from '../empty-state/empty-state.component';
import {FwRefreshBannerComponent} from '../refresh-banner/refresh-banner.component';
import {FwButtonComponent} from '../button/button.component';

// Importer les services
import {ViewPreferenceService} from '../../services/view-preference.service';

@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    LucideAngularModule,
    ExpandableViewComponent,
    CardsViewComponent,
    TableViewComponent,
    TimelineViewComponent,
    CardSkeletonComponent,
    MatMenuModule,
    BlockLoaderComponent,
    FwEmptyStateComponent,
    FwRefreshBannerComponent,
    FwButtonComponent
  ],
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss']
})
export class DataListComponent {
  // ===========================================
  // CONSTRUCTEUR
  // ===========================================

  constructor(private viewPreferenceService: ViewPreferenceService) {
    // La vue sera initialisée dans ngOnInit pour prendre en compte les inputs
  }

  ngOnInit() {
    // Charger la préférence de vue au démarrage ou utiliser la vue par défaut
    const savedView = this.viewPreferenceService.getPreferredView()();

    // Priorité :
    // 1. Vue sauvegardée par l'utilisateur
    // 2. Vue définie par le développeur (defaultView)
    // 3. Vue par défaut du système (expandable)
    if (savedView) {
      this.viewMode.set(savedView);
    } else if (this.defaultView()) {
      this.viewMode.set(this.defaultView());
    }
  }

  // ===========================================
  // INPUTS (données fournies par le parent)
  // ===========================================

  /** Les données à afficher */
  data = input<TableRow[]>([]);

  /** Vue par défaut (si aucune préférence n'est enregistrée) */
  defaultView = input<ViewMode>('expandable');

  /** Les onglets disponibles */
  tabs = input<TabItem[]>([]);

  /** L'onglet actif */
  activeTab = input<string>('Tous');

  /** Nombre total d'éléments (pour la pagination) */
  total = input<number>(0);

  /** Page courante (index base 0) */
  page = input<number>(0);

  /** Nombre total de pages */
  totalPages = input<number>(1);

  /** Afficher ou non la barre de recherche */
  showSearch = input<boolean>(true);

  /** Afficher ou non le bouton de filtres */
  showFilterButton = input<boolean>(true);

  /** Actions disponibles sur chaque ligne */
  actions = input<RowAction[]>([]);

  /** État de chargement */
  isLoading = input<boolean>(false);

  /** Données périmées (Impératif 3) */
  isStale = input<boolean>(false);

  /** Mode carte (bordures, fond blanc) ou intégré */
  cardMode = input<boolean>(true);

  // ===========================================
  // OUTPUTS (événements vers le parent)
  // ===========================================

  /** Changement d'onglet */
  onTabChange = output<string>();

  /** Recherche */
  onSearch = output<string>();

  /** Demande de rafraîchissement */
  onRefresh = output<void>();

  /** Événement d'action dynamique */
  onAction = output<{ actionId: string, row: TableRow }>();

  /** Clic sur une ligne (Action primaire de navigation) */
  onRowClick = output<TableRow>();

  /** Actions groupées */
  onBulkValidate = output<(string | number)[]>();

  /** Changement de tri */
  onSortChange = output<SortState>();

  /** Pagination */
  onPageChange = output<number>();

  // ===========================================
  // ÉTATS INTERNES (signals)
  // ===========================================

  /** Mode d'affichage actuel */
  viewMode = signal<ViewMode>('expandable');

  /** Requête de recherche */
  searchQuery = signal('');

  /** IDs sélectionnés */
  selectedIds = model<Set<string | number>>(new Set());

  /** IDs des lignes dépliées (pour vue expandable) */
  expandedIds = signal<Set<string | number>>(new Set());

  /** État du tri */
  sortState = signal<SortState>({
    column: '',
    direction: null
  });

  // ===========================================
  // CONFIGURATION DES VUES DISPONIBLES
  // ===========================================

  /** Liste des vues disponibles */
  viewOptions: ViewConfig[] = [
    {
      id: 'expandable',
      label: 'Vue Extensible',
      icon: Layers,
      description: 'Lignes avec détails dépliables',
      isAvailable: true
    },
    {
      id: 'cards',
      label: 'Vue Cartes',
      icon: LayoutGrid,
      description: 'Affichage moderne en cartes',
      isAvailable: true
    },
    {
      id: 'table',
      label: 'Vue Tableau',
      icon: Table,
      description: 'Affichage classique en lignes et colonnes',
      isAvailable: true
    },
    {
      id: 'timeline',
      label: 'Vue Chronologique',
      icon: Calendar,
      description: 'Organisation par date',
      isAvailable: true
    }
  ];

  // ===========================================
  // COMPUTED STATES (états calculés)
  // ===========================================

  /** État de la sélection */
  selectionState = computed<SelectionState>(() => {
    const ids = this.selectedIds();
    const data = this.data();
    const count = ids.size;

    return {
      selectedIds: ids,
      count,
      isAllSelected: data.length > 0 && count === data.length,
      isPartiallySelected: count > 0 && count < data.length
    };
  });

  /** État de la recherche */
  searchState = computed<SearchState>(() => ({
    query: this.searchQuery(),
    isActive: this.searchQuery().length > 0
  }));

  /** Vues disponibles (filtrées) */
  availableViews = computed(() =>
    this.viewOptions.filter(v => v.isAvailable)
  );

  /** Données triées selon l'état du tri */
  sortedData = computed(() => {
    const data = this.data();
    const { column, direction } = this.sortState();

    if (!direction || !column || data.length === 0) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'subtitle':
          aValue = a.subtitle?.toLowerCase() || '';
          bValue = b.subtitle?.toLowerCase() || '';
          break;
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  /** Données à afficher (triées) */
  displayedData = computed(() => this.sortedData());

  /** Liste de pages pour le footer */
  pageNumbers = computed(() => {
    const totalPages = Math.max(1, this.totalPages());
    const current = this.page();
    const start = Math.max(0, current - 1);
    const end = Math.min(totalPages - 1, start + 2);

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  /** Gérer le clic sur une ligne (Relais typé) */
  handleRowClick(row: TableRow): void {
    this.onRowClick.emit(row);
  }

  // ===========================================
  // MÉTHODES DE SÉLECTION
  // ===========================================

  /** Basculer la sélection d'une ligne */
  toggleRow(id: string | number): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  /** Basculer la sélection de toutes les lignes */
  toggleAll(): void {
    if (this.selectionState().isAllSelected) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.data().map(r => r.id)));
    }
  }

  /** Effacer toute la sélection */
  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /** Vérifier si une ligne est sélectionnée */
  isSelected(id: string | number): boolean {
    return this.selectedIds().has(id);
  }

  /** Obtenir le tableau des IDs sélectionnés */
  getSelectedIdsArray(): (string | number)[] {
    return Array.from(this.selectedIds());
  }

  // ===========================================
  // MÉTHODES D'EXPANSION
  // ===========================================

  /** Basculer l'expansion d'une ligne */
  toggleExpand(id: string | number): void {
    const next = new Set(this.expandedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedIds.set(next);
  }

  /** Vérifier si une ligne est dépliée */
  isExpanded(id: string | number): boolean {
    return this.expandedIds().has(id);
  }

  // ===========================================
  // MÉTHODES DE RECHERCHE
  // ===========================================

  /** Mettre à jour la recherche */
  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.onSearch.emit(query);
  }

  /** Effacer la recherche */
  clearSearch(): void {
    this.searchQuery.set('');
    this.onSearch.emit('');
  }

  // ===========================================
  // MÉTHODES DE VUE
  // ===========================================

  /** Changer le mode d'affichage */
  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  // ===========================================
  // MÉTHODES DE TRI
  // ===========================================

  /** Gérer le changement de tri */
  handleSort(sortState: SortState): void {
    this.sortState.set(sortState);
    this.onSortChange.emit(sortState);
  }

  /** Réinitialiser le tri */
  clearSort(): void {
    this.sortState.set({
      column: '',
      direction: null
    });
    this.onSortChange.emit({
      column: '',
      direction: null
    });
  }

  previousPage(): void {
    if (this.page() <= 0) return;
    this.onPageChange.emit(this.page() - 1);
  }

  nextPage(): void {
    if (this.page() >= this.totalPages() - 1) return;
    this.onPageChange.emit(this.page() + 1);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) return;
    this.onPageChange.emit(page);
  }

  // ===========================================
  // UTILITAIRES
  // ===========================================

  /** Obtenir la classe CSS d'un badge selon son type */
  getBadgeClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'danger': return 'bg-red-50 text-red-700 border-red-200';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  /** Obtenir l'icône de la vue actuelle */
  getCurrentViewIcon(): any {
    const currentView = this.viewOptions.find(v => v.id === this.viewMode());
    return currentView?.icon || Layers;
  }

  /** Obtenir le label de la vue actuelle */
  getCurrentViewLabel(): string {
    const currentView = this.viewOptions.find(v => v.id === this.viewMode());
    return currentView?.label || 'Vue Extensible';
  }

  /** Vérifier si une vue est nouvelle (pour afficher le badge) */
  isNewView(viewId: string): boolean {
    const newViews = ['cards', 'timeline'];
    return newViews.includes(viewId);
  }

  // ===========================================
  // EXPOSITION DES ICÔNES AU TEMPLATE
  // ===========================================
  protected readonly LayoutGrid = LayoutGrid;
  protected readonly Table = Table;
  protected readonly Calendar = Calendar;
  protected readonly Layers = Layers;
  protected readonly Search = Search;
  protected readonly X = X;
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronRight = ChevronRight;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Trash2 = Trash2;
  protected readonly Download = Download;
  protected readonly Archive = Archive;
  protected readonly Inbox = Inbox;
  protected readonly ChevronDown = ChevronDown;
  protected readonly Sparkles = Sparkles;
  protected readonly Check = Check;
  protected readonly Filter = Filter;

  isFiltersOpen = signal(false);

  toggleFilters() {
    this.isFiltersOpen.update(v => !v);
  }
}
