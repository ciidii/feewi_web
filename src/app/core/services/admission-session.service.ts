import { Injectable, signal, computed } from '@angular/core';

export interface AdmissionSession {
  reference: string;
  accessCode: string;
  studentName?: string;
  lastUpdated: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdmissionSessionService {
  private readonly STORAGE_KEY = 'feewi_admission_session';

  // Signal pour l'état de la session (réactivité immédiate dans l'UI)
  private _currentSession = signal<AdmissionSession | null>(null);
  
  // Exposition en lecture seule
  readonly currentSession = this._currentSession.asReadonly();
  readonly hasActiveSession = computed(() => this._currentSession() !== null);

  constructor() {
    this.loadSessionFromStorage();
  }

  /**
   * Sauvegarder les identifiants de session dans le LocalStorage
   */
  saveSession(reference: string, accessCode: string, studentName?: string): void {
    const session: AdmissionSession = {
      reference,
      accessCode,
      studentName,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    this._currentSession.set(session);
  }

  /**
   * Récupérer la session actuelle
   */
  getSession(): AdmissionSession | null {
    return this._currentSession();
  }

  /**
   * Nettoyer la session (à appeler après une soumission finale réussie ou abandon)
   */
  clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentSession.set(null);
  }

  /**
   * Charger la session au démarrage du service
   */
  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AdmissionSession;
        // Optionnel : On pourrait vérifier ici si la session n'est pas trop ancienne (ex: > 30 jours)
        this._currentSession.set(session);
      }
    } catch (e) {
      console.error('Erreur lors de la lecture de la session d\'admission', e);
      this.clearSession();
    }
  }
}
