import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sparkles } from 'lucide-angular';
import { ViewMode, ViewConfig } from '../../../../models/data-list.models';
import { ViewPreferenceService } from '../../../../services/view-preference.service';

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

  /** Position du tooltip (calculée dynamiquement) */
  tooltipPosition = signal<{ top: number; left: number } | null>(null);

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
  showTooltip(viewId: string, event?: MouseEvent): void {
    this.activeTooltip.set(viewId);

    // Calculer la position du tooltip si l'événement est disponible
    if (event) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      this.tooltipPosition.set({
        top: rect.top - 30, // 30px au-dessus de l'élément
        left: rect.left + (rect.width / 2) - 50 // Centré approximativement
      });
    }
  }

  /**
   * Cacher le tooltip
   */
  hideTooltip(): void {
    this.activeTooltip.set(null);
    this.tooltipPosition.set(null);
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

  /**
   * Obtenir la description d'une vue par son ID
   */
  getViewDescription(viewId: string): string {
    const view = this.views().find(v => v.id === viewId);
    return view?.description || '';
  }

  /**
   * Vérifier si une vue est "nouvelle" (pour afficher le badge)
   */
  isNewView(viewId: string): boolean {
    // Exemple: les vues cards et timeline sont considérées comme nouvelles
    return viewId === 'cards' || viewId === 'timeline';
  }

  /**
   * Marquer une vue comme vue
   */
  markViewAsSeen(viewId: string): void {
    try {
      localStorage.setItem(`view-${viewId}-seen`, 'true');
    } catch (error) {
      console.warn('Impossible d\'accéder au localStorage', error);
    }
  }

  /**
   * Vérifier si une vue a déjà été vue
   */
  hasViewBeenSeen(viewId: string): boolean {
    try {
      return localStorage.getItem(`view-${viewId}-seen`) === 'true';
    } catch (error) {
      return false;
    }
  }

  protected readonly Sparkles = Sparkles;
}
