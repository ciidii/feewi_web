import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Importer les icônes nécessaires
import {
  LucideAngularModule,
  Eye,
  CheckCircle,
  Printer,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Table
} from 'lucide-angular';
import {RowAction, TableRow} from '../../../../models/data-list.models';
import { SmartTooltipDirective } from '../../../../directives/smart-tooltip.directive';
import { FwDatePipe } from '../../../../pipes/fw-date.pipe';


export type SortDirection = 'asc' | 'desc' | null;
export interface SortState {
  column: string;
  direction: SortDirection;
}

@Component({
  selector: 'app-table-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    LucideAngularModule,
    SmartTooltipDirective,
    FwDatePipe
  ],
  templateUrl: './table-view.html',
  styleUrls: ['./table-view.scss']
})
export class TableViewComponent {
  // ===========================================
  // INPUTS
  // ===========================================

  /** Les données à afficher */
  data = input<TableRow[]>([]);

  /** IDs des éléments sélectionnés */
  selectedIds = input<Set<string | number>>(new Set());

  /** Fonction pour obtenir la classe d'un badge */
  getBadgeClass = input.required<(type: string) => string>();

  /** Actions disponibles */
  actions = input<RowAction[]>([]);

  // ===========================================
  // OUTPUTS
  // ===========================================

  /** Basculer la sélection d'une ligne */
  toggleRow = output<string | number>();

  /** Émettre un clic sur la ligne (Action primaire) */
  onRowClick = output<TableRow>();

  /** Basculer la sélection de toutes les lignes */
  toggleAll = output<void>();

  /** Émettre une action */
  onAction = output<{ actionId: string, row: TableRow }>();

  /** Trier */
  onSort = output<SortState>();

  // ===========================================
  // ÉTAT INTERNE
  // ===========================================

  /** État du tri */
  sortState: SortState = {
    column: '',
    direction: null
  };

  /** Colonne survolée */
  hoveredColumn: string | null = null;

  /** Largeurs des colonnes */
  columnWidths: Record<string, number> = {};

  /** État du redimensionnement */
  private resizing = {
    active: false,
    column: '',
    startX: 0,
    startWidth: 0
  };

  // ===========================================
  // MÉTHODES
  // ===========================================

  /** Démarrer le redimensionnement */
  startResizing(event: MouseEvent, column: string): void {
    event.preventDefault();
    event.stopPropagation();

    const header = (event.target as HTMLElement).parentElement;
    if (!header) return;

    this.resizing = {
      active: true,
      column,
      startX: event.pageX,
      startWidth: header.offsetWidth
    };

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.body.style.cursor = 'col-resize';
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.resizing.active) return;

    const diff = event.pageX - this.resizing.startX;
    const newWidth = Math.max(80, this.resizing.startWidth + diff);
    
    this.columnWidths = {
      ...this.columnWidths,
      [this.resizing.column]: newWidth
    };
  };

  private onMouseUp = (): void => {
    this.resizing.active = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.body.style.cursor = 'default';
  };

  /** Vérifier si une ligne est sélectionnée */
  isSelected(id: string | number): boolean {
    return this.selectedIds().has(id);
  }

  /** Vérifier si toutes les lignes sont sélectionnées */
  isAllSelected(): boolean {
    return this.data().length > 0 &&
      this.selectedIds().size === this.data().length;
  }

  /** Vérifier si la sélection est partielle */
  isPartiallySelected(): boolean {
    return this.selectedIds().size > 0 &&
      this.selectedIds().size < this.data().length;
  }

  /** Gérer le clic sur l'en-tête de colonne */
  handleSort(column: string): void {
    let direction: SortDirection = 'asc';

    if (this.sortState.column === column) {
      if (this.sortState.direction === 'asc') {
        direction = 'desc';
      } else if (this.sortState.direction === 'desc') {
        direction = null;
      }
    }

    this.sortState = { column, direction };
    this.onSort.emit(this.sortState);
  }

  /** Obtenir l'icône de tri pour une colonne */
  getSortIcon(column: string): any {
    if (this.sortState.column !== column) {
      return ArrowUpDown;
    }
    return this.sortState.direction === 'asc' ? ArrowUp : ArrowDown;
  }

  /** Obtenir la classe CSS d'une action */
  getActionClass(action: RowAction): string {
    switch (action.type) {
      case 'primary': return 'text-primary-600 hover:bg-primary-50';
      case 'danger': return 'text-rose-600 hover:bg-rose-50';
      case 'success': return 'text-emerald-600 hover:bg-emerald-50';
      case 'warning': return 'text-amber-600 hover:bg-amber-50';
      default: return 'text-slate-600 hover:bg-slate-100';
    }
  }

  // ===========================================
  // EXPOSITION DES ICÔNES
  // ===========================================

  protected readonly Eye = Eye;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Printer = Printer;
  protected readonly MoreHorizontal = MoreHorizontal;
  protected readonly ArrowUpDown = ArrowUpDown;
  protected readonly ArrowUp = ArrowUp;
  protected readonly ArrowDown = ArrowDown;
  protected readonly Table = Table;
}
