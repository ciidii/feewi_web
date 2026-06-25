import {Injectable, signal} from '@angular/core';
import {ViewMode} from '../models/data-list.models';

@Injectable({
  providedIn: 'root'
})
export class ViewPreferenceService {
  private readonly STORAGE_KEY = 'app-view-preference';

  // Signal pour la vue préférée
  private preferredViewSignal = signal<ViewMode>(this.loadPreference());

  constructor() {
    // Écouter les changements dans localStorage (pour plusieurs onglets)
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY && event.newValue) {
        this.preferredViewSignal.set(JSON.parse(event.newValue));
      }
    });
  }

  /**
   * Obtenir la vue préférée (readonly)
   */
  getPreferredView() {
    return this.preferredViewSignal.asReadonly();
  }

  /**
   * Définir la vue préférée
   */
  setPreferredView(mode: ViewMode): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mode));
      this.preferredViewSignal.set(mode);
    } catch (error) {
      console.warn('Impossible de sauvegarder la préférence:', error);
    }
  }

  /**
   * Charger la préférence depuis localStorage
   */
  private loadPreference(): ViewMode {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Valider que c'est un ViewMode valide
        if (this.isValidViewMode(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Impossible de charger la préférence:', error);
    }
    return 'expandable'; // Valeur par défaut
  }

  /**
   * Valider le mode de vue
   */
  private isValidViewMode(mode: any): mode is ViewMode {
    return ['table', 'cards', 'timeline', 'expandable'].includes(mode);
  }
}
