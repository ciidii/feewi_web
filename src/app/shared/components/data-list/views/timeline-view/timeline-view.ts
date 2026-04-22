import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Importer les icônes
import {
  LucideAngularModule,
  Eye,
  CheckCircle,
  Calendar,
  Clock,
  ChevronRight,
  Circle, MapPin
} from 'lucide-angular';
import { RowAction, TableRow } from '../../../../models/data-list.models';
import { FwButtonComponent } from '../../../button/button.component';
import { FwBadgeComponent } from '../../../badge/badge.component';


export interface TimelineGroup {
  date: string;
  items: TableRow[];
}

@Component({
  selector: 'app-timeline-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    LucideAngularModule,
    FwButtonComponent,
    FwBadgeComponent
  ],
  templateUrl: './timeline-view.html',
  styleUrls: ['./timeline-view.scss']
})
export class TimelineViewComponent {

  // ===========================================
  // INPUTS
  // ===========================================

  /** Les données à afficher */
  data = input<TableRow[]>([]);

  /** État de chargement */
  isLoading = input<boolean>(false);

  /** IDs des éléments sélectionnés */
  selectedIds = input<Set<string | number>>(new Set());

  /** Fonction pour obtenir la classe d'un badge */
  getBadgeClass = input.required<(type: string) => string>();

  /** Actions disponibles */
  actions = input<RowAction[]>([]);

  // ===========================================
  // OUTPUTS
  // ===========================================

  /** Basculer la sélection d'un élément */
  toggleRow = output<string | number>();

  /** Émettre un clic sur l'élément (Action primaire) */
  onRowClick = output<TableRow>();

  /** Émettre une action */
  onAction = output<{ actionId: string, row: TableRow }>();

  // ===========================================
  // DONNÉES COMPUTÉES
  // ===========================================

  /** Grouper les données par date */
  groupedData = computed<TimelineGroup[]>(() => {
    const groups: { [key: string]: TableRow[] } = {};

    this.data().forEach(item => {
      const date = item.date || 'Sans date';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    // Trier les groupes par date (plus récent d'abord)
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Sans date') return 1;
        if (b === 'Sans date') return -1;
        return new Date(b).getTime() - new Date(a).getTime();
      })
      .map(date => ({
        date,
        items: groups[date].sort((x, y) => {
          if (!x.date) return 1;
          if (!y.date) return -1;
          return new Date(y.date).getTime() - new Date(x.date).getTime();
        })
      }));
  });

  // ===========================================
  // MÉTHODES
  // ===========================================

  /** Vérifier si un élément est sélectionné */
  isSelected(id: string | number): boolean {
    return this.selectedIds().has(id);
  }

  /** Formater la date pour l'affichage */
  formatDate(date: string): string {
    if (date === 'Sans date') return date;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const itemDate = new Date(date).toDateString();

    if (itemDate === today) return "Aujourd'hui";
    if (itemDate === yesterday) return "Hier";
    return date;
  }

  /** Obtenir la couleur de la ligne temporelle */
  getTimelineColor(index: number): string {
    const colors = [
      'border-primary-500',
      'border-amber-500',
      'border-green-500',
      'border-purple-500',
      'border-blue-500'
    ];
    return colors[index % colors.length];
  }

  /** Obtenir la classe CSS d'une action */
  getActionClass(action: RowAction): string {
    switch (action.type) {
      case 'primary': return 'primary';
      case 'danger': return 'text-rose-600 border-rose-200 hover:bg-rose-50';
      case 'success': return 'text-emerald-600 border-emerald-200 hover:bg-emerald-50';
      case 'warning': return 'text-amber-600 border-amber-200 hover:bg-amber-50';
      default: return '';
    }
  }

  // ===========================================
  // EXPOSITION DES ICÔNES
  // ===========================================

  protected readonly Eye = Eye;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Calendar = Calendar;
  protected readonly Clock = Clock;
  protected readonly ChevronRight = ChevronRight;
  protected readonly Circle = Circle;
  protected readonly MapPin = MapPin;
}
