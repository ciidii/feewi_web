import {Component, computed, input, output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';

// Importer les icônes nécessaires
import {Calendar, CheckCircle, Clock, Eye, LucideAngularModule, MapPin, MoreHorizontal} from 'lucide-angular';
import {RowAction, TableRow} from '../../../../models/data-list.models';
import {FwBadgeComponent} from '../../../badge/badge.component';
import {FwButtonComponent} from '../../../button/button.component';
import {FwDatePipe} from '../../../../pipes/fw-date.pipe';

interface GroupedTimeline {
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
    FwBadgeComponent,
    FwButtonComponent,
    FwDatePipe
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

  /** Basculer la sélection d'une ligne */
  toggleRow = output<string | number>();

  /** Émettre un clic sur la ligne (Action primaire) */
  onRowClick = output<TableRow>();

  /** Émettre une action */
  onAction = output<{ actionId: string, row: TableRow }>();

  // ===========================================
  // CALCULS
  // ===========================================

  /** Grouper les données par date pour l'affichage chronologique */
  groupedData = computed<GroupedTimeline[]>(() => {
    const groups: Record<string, TableRow[]> = {};
    
    this.data().forEach(item => {
      const date = item.date || 'Inconnu';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      items
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  // ===========================================
  // MÉTHODES UTILITAIRES
  // ===========================================

  /** Vérifier si une ligne est sélectionnée */
  isSelected(id: string | number): boolean {
    return this.selectedIds().has(id);
  }

  /** Obtenir une couleur alternée pour les points de la timeline */
  getTimelineColor(index: number): string {
    const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  }

  // ===========================================
  // EXPOSITION DES ICÔNES
  // ===========================================

  protected readonly Eye = Eye;
  protected readonly CheckCircle = CheckCircle;
  protected readonly MoreHorizontal = MoreHorizontal;
  protected readonly Clock = Clock;
  protected readonly MapPin = MapPin;
  protected readonly Calendar = Calendar;
}
