import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Importer les icônes nécessaires
import {
  LucideAngularModule,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle,
  Printer,
  Download,
  Mail
} from 'lucide-angular';
import {TableRow} from '../../../../models/data-list.models';

@Component({
  selector: 'app-expandable-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    LucideAngularModule
  ],
  templateUrl: './expandable-view.html',
  styleUrls: ['./expandable-view.scss']
})
export class ExpandableViewComponent {
  // ===========================================
  // INPUTS
  // ===========================================

  /** Les données à afficher */
  data = input<TableRow[]>([]);

  /** IDs des éléments sélectionnés */
  selectedIds = input<Set<string | number>>(new Set());

  /** IDs des éléments dépliés */
  expandedIds = input<Set<string | number>>(new Set());

  /** Fonction pour obtenir la classe d'un badge */
  getBadgeClass = input<(type: string) => string>();

  // ===========================================
  // OUTPUTS
  // ===========================================

  /** Basculer la sélection d'une ligne */
  toggleRow = output<string | number>();

  /** Basculer l'expansion d'une ligne */
  toggleExpand = output<string | number>();

  /** Voir les détails */
  onView = output<TableRow>();

  /** Valider */
  onValidate = output<TableRow>();

  /** Imprimer */
  onPrint = output<TableRow>();

  // ===========================================
  // MÉTHODES UTILITAIRES
  // ===========================================

  /** Vérifier si une ligne est sélectionnée */
  isSelected(id: string | number): boolean {
    return this.selectedIds().has(id);
  }

  /** Vérifier si une ligne est dépliée */
  isExpanded(id: string | number): boolean {
    return this.expandedIds().has(id);
  }

  // ===========================================
  // EXPOSITION DES ICÔNES
  // ===========================================

  protected readonly ChevronDown = ChevronDown;
  protected readonly ChevronRight = ChevronRight;
  protected readonly Eye = Eye;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Printer = Printer;
  protected readonly Download = Download;
  protected readonly Mail = Mail;
}
