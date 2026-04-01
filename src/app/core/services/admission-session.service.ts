import { Injectable, signal, computed } from '@angular/core';

export interface AdmissionSession {
  reference: string;
  accessCode: string;
  studentName?: string;
  currentStep?: string;
  lastUpdated: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdmissionSessionService {
  private readonly STORAGE_KEY = 'feewi_admission_session';

  private _currentSession = signal<AdmissionSession | null>(null);
  readonly currentSession = this._currentSession.asReadonly();
  readonly hasActiveSession = computed(() => this._currentSession() !== null);

  constructor() {
    this.loadSessionFromStorage();
  }

  saveSession(reference: string, accessCode: string, studentName?: string, currentStep?: string): void {
    console.log('💾 Tentative de sauvegarde session:', { reference, currentStep });
    const session: AdmissionSession = {
      reference,
      accessCode,
      studentName,
      currentStep,
      lastUpdated: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      this._currentSession.set(session);
      console.log('✅ Session sauvegardée avec succès dans LocalStorage');
    } catch (e) {
      console.error('❌ Échec de l\'écriture dans LocalStorage:', e);
    }
  }

  updateStep(step: string): void {
    const session = this._currentSession();
    if (session) {
      this.saveSession(session.reference, session.accessCode, session.studentName, step);
    }
  }

  getSession(): AdmissionSession | null {
    const session = this._currentSession();
    console.log('🔍 Récupération session actuelle:', session);
    return session;
  }

  clearSession(): void {
    console.warn('🗑️ Nettoyage de la session d\'admission');
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentSession.set(null);
  }

  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        console.log('📦 Données brutes trouvées dans LocalStorage:', stored);
        const session = JSON.parse(stored) as AdmissionSession;
        this._currentSession.set(session);
        console.log('✅ Session chargée et synchronisée avec le Signal');
      } else {
        console.log('ℹ️ Aucune session existante dans LocalStorage');
      }
    } catch (e) {
      console.error('❌ Erreur lors du parsing de la session stockée:', e);
      this.clearSession();
    }
  }
}
