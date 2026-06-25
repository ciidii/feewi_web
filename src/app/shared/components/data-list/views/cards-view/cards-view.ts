import {Component, input, output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';

// Importer les icônes nécessaires
import {
  Calendar,
  Check,
  CheckCircle,
  Eye,
  Globe,
  Hash,
  LayoutGrid,
  LucideAngularModule,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone
} from 'lucide-angular';
import {RowAction, TableRow} from '../../../../models/data-list.models';
import {FwBadgeComponent} from '../../../badge/badge.component';
import {FwButtonComponent} from '../../../button/button.component';
import {FwDatePipe} from '../../../../pipes/fw-date.pipe';
import {HasPermissionDirective} from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-cards-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    LucideAngularModule,
    FwBadgeComponent,
    FwButtonComponent,
    FwDatePipe
  ],
  templateUrl: './cards-view.html',
  styleUrls: ['./cards-view.scss']
})
export class CardsViewComponent {
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

  /** Actions filtrées (PBAC) */
  filteredActions = input<RowAction[]>([]);

// Ajouter cette méthode
  getInitials(title: string): string {
    if (!title) return '?';

    const words = title.split(' ');
    if (words.length === 1) {
      return title.substring(0, 2).toUpperCase();
    }

    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  // ===========================================
  // OUTPUTS
  // ===========================================

  /** Basculer la sélection d'une carte */
  toggleRow = output<string | number>();

  /** Émettre un clic sur la ligne (Action primaire) */
  onRowClick = output<TableRow>();

  /** Émettre une action */
  onAction = output<{ actionId: string, row: TableRow }>();

  // ===========================================
  // MÉTHODES UTILITAIRES
  // ===========================================

  /** Vérifier si une carte est sélectionnée */
  isSelected(id: string | number): boolean {
    return this.selectedIds().has(id);
  }

  /** Formater la date pour l'affichage */
  formatDate(date?: string): string {
    if (!date) return 'Date non définie';
    return date;
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
  protected readonly MoreHorizontal = MoreHorizontal;
  protected readonly Calendar = Calendar;
  protected readonly MapPin = MapPin;
  protected readonly Mail = Mail;
  protected readonly Phone = Phone;
  protected readonly LayoutGrid = LayoutGrid;
  protected readonly Globe = Globe;
  protected readonly Check = Check;
  protected readonly Hash = Hash;
}
