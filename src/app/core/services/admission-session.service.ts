import { Injectable, signal, computed } from '@angular/core';

export interface AdmissionSession {
  bundleId: string;
  accessCode: string;
  parentName?: string;
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

  saveSession(bundleId: string, accessCode: string, parentName?: string, currentStep?: string): void {
    const session: AdmissionSession = {
      bundleId,
      accessCode,
      parentName,
      currentStep,
      lastUpdated: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      this._currentSession.set(session);
    } catch (e) {
      console.error('Session write error:', e);
    }
  }

  updateStep(step: string): void {
    const session = this._currentSession();
    if (session) {
      this.saveSession(session.bundleId, session.accessCode, session.parentName, step);
    }
  }

  getSession(): AdmissionSession | null {
    return this._currentSession();
  }

  clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentSession.set(null);
  }

  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this._currentSession.set(JSON.parse(stored) as AdmissionSession);
      }
    } catch {
      this.clearSession();
    }
  }
}
