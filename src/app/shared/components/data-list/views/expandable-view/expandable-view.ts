import {Component, input, output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';

// Importer les icônes nécessaires
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  LucideAngularModule,
  Mail,
  Printer
} from 'lucide-angular';
import { RowAction, TableRow } from '../../../../models/data-list.models';
import { SkeletonComponent } from '../../../skeleton/skeleton.component';
import { FwButtonComponent } from '../../../button/button.component';
import { FwBadgeComponent } from '../../../badge/badge.component';

@Component({
  selector: 'app-expandable-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    LucideAngularModule,
    SkeletonComponent,
    FwButtonComponent,
    FwBadgeComponent
  ],
  templateUrl: './expandable-view.html',
  styleUrls: ['./expandable-view.scss']
})
export class ExpandableViewComponent {
  // ===========================================
  // INPUTS
  // ===========================================

  /** Les donn├®es ├á afficher */
  data = input<TableRow[]>([]);

  /** ├ëtat de chargement */
  isLoading = input<boolean>(false);

  /** IDs des éléments sélectionnés */
  selectedIds = input<Set<string | number>>(new Set());

  /** IDs des éléments dépliés */
  expandedIds = input<Set<string | number>>(new Set());

  /** Fonction pour obtenir la classe d'un badge */
  getBadgeClass = input.required<(type: string) => string>();

  /** Actions disponibles */
  actions = input<RowAction[]>([]);

  // ===========================================
  // OUTPUTS
  // ===========================================

  /** Basculer la sélection d'une ligne */
  toggleRow = output<string | number>();

  /** Basculer l'expansion d'une ligne */
  toggleExpand = output<string | number>();

  /** Émettre un clic sur la ligne (Action primaire) */
  onRowClick = output<TableRow>();

  /** Émettre une action */
  onAction = output<{ actionId: string, row: TableRow }>();

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

  /** Obtenir la liste des métadonnées affichables */
  getDisplayableMetadata(row: TableRow): { key: string, value: any }[] {
    const meta = row.metadata || {};
    const raw = row.rawData || {};

    // Fusionner les deux sources (priorité aux metadata)
    const combined = {...raw, ...meta};

    // Liste des clés à ignorer (déjà affichées ou techniques)
    const blackList = ['id', 'title', 'subtitle', 'avatarUrl', 'avatarLabel', 'date', 'badges', 'isSelf', 'rawData', 'permissions'];

    return Object.entries(combined)
      .filter(([key]) => !blackList.includes(key) && typeof combined[key as keyof typeof combined] !== 'object')
      .map(([key, value]) => ({
        key: this.formatKey(key),
        value: value
      }))
      .slice(0, 8); // Limiter à 8 éléments pour garder un design propre
  }

  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1') // CamelCase to spaces
      .replace(/_/g, ' ')        // Underscores to spaces
      .trim()
      .toLowerCase();
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
