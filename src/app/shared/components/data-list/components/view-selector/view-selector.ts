import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ViewMode, ViewConfig } from '../../models/data-list.models';
import { ViewPreferenceService } from '../../services/view-preference.service';

@Component({
  selector: 'app-view-selector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './view-selector.html',
  styleUrls: ['./view-selector.scss']
})
export class ViewSelectorComponent {
  // ===========================================
  // INPUTS
  // ===========================================

  /** Liste des vues disponibles */
  views = input<ViewConfig[]>([]);

  /** Vue actuellement active */
  activeView = input<ViewMode>('expandable');

  /** Si la persistance est activée */
  persistPreference = input<boolean>(true);

  // ===========================================
  // OUTPUTS
  // ===========================================

  /** Émis quand la vue change */
  viewChange = output<ViewMode>();

  // ===========================================
  // ÉTAT INTERNE
  // ===========================================

  /** Tooltip visible pour une vue */
  activeTooltip = signal<string | null>(null);

  constructor(private viewPreferenceService: ViewPreferenceService) {
    // Si la persistance est activée, charger la préférence au démarrage
    if (this.persistPreference()) {
      const savedView = this.viewPreferenceService.getPreferredView()();
      if (savedView !== this.activeView()) {
        this.viewChange.emit(savedView);
      }
    }

    // Effet pour sauvegarder la préférence quand elle change
    effect(() => {
      if (this.persistPreference()) {
        this.viewPreferenceService.setPreferredView(this.activeView());
      }
    });
  }

  // ===========================================
  // MÉTHODES
  // ===========================================

  /**
   * Changer la vue
   */
  changeView(mode: ViewMode): void {
    if (mode !== this.activeView()) {
      this.viewChange.emit(mode);
    }
  }

  /**
   * Afficher le tooltip
   */
  showTooltip(viewId: string): void {
    this.activeTooltip.set(viewId);
  }

  /**
   * Cacher le tooltip
   */
  hideTooltip(): void {
    this.activeTooltip.set(null);
  }

  /**
   * Vérifier si une vue est disponible
   */
  isViewAvailable(view: ViewConfig): boolean {
    return view.isAvailable;
  }

  /**
   * Obtenir les vues disponibles uniquement
   */
  getAvailableViews(): ViewConfig[] {
    return this.views().filter(v => v.isAvailable);
  }

  protected readonly localStorage = localStorage;
}
