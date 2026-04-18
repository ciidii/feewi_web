import { Injectable, signal, computed } from '@angular/core';

export interface AdmissionSession {
  bundleId: string;
  accessCode: string;
  parentName?: string;
  currentGlobalPhase?: string;
  currentChildPhase?: string;
  currentAdmissionId?: string;
  lastUpdated: number;
}

@Injectable({ providedIn: 'root' })
export class AdmissionSessionService {
  private readonly STORAGE_KEY = 'feewi_admission_session';

  private _session = signal<AdmissionSession | null>(null);
  readonly currentSession = this._session.asReadonly();
  readonly hasActiveSession = computed(() => this._session() !== null);

  constructor() { this.load(); }

  saveSession(bundleId: string, accessCode: string, parentName?: string): void {
    this.persist({ bundleId, accessCode, parentName, lastUpdated: Date.now() });
  }

  updatePhase(globalPhase: string, childPhase?: string, admissionId?: string): void {
    const s = this._session();
    if (!s) return;
    this.persist({ ...s, currentGlobalPhase: globalPhase, currentChildPhase: childPhase, currentAdmissionId: admissionId, lastUpdated: Date.now() });
  }

  getSession(): AdmissionSession | null { return this._session(); }

  clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._session.set(null);
  }

  private persist(session: AdmissionSession): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      this._session.set(session);
    } catch (e) { console.error('Session write error:', e); }
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) this._session.set(JSON.parse(stored) as AdmissionSession);
    } catch { this.clearSession(); }
  }
}
