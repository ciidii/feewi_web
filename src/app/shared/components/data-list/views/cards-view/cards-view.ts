import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Importer les icônes nécessaires
import {
  LucideAngularModule,
  Eye,
  CheckCircle,
  MoreHorizontal,
  Calendar,
  MapPin,
  Mail,
  Phone,
  LayoutGrid, Globe, Check
} from 'lucide-angular';
import {TableRow} from '../../../../models/data-list.models';

// Importer les modèles

@Component({
  selector: 'app-cards-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    LucideAngularModule
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

  /** Voir les détails */
  onView = output<TableRow>();

  /** Valider */
  onValidate = output<TableRow>();

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
}
