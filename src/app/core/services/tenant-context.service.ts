import {computed, Injectable, signal} from '@angular/core';

export interface Tenant {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  allowedCycles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  // Signal privé pour stocker le tenant actif
  private _activeTenant = signal<Tenant | null>(null);

  // Exposition du signal en lecture seule
  readonly activeTenant = this._activeTenant.asReadonly();

  // Sélecteur pour vérifier si un tenant est sélectionné
  readonly hasTenant = computed(() => this._activeTenant() !== null);

  constructor() {
    // Dans un environnement multi-tenant réel, on extrairait l'ID du sous-domaine.
    // Pour le développement local, on peut initialiser un tenant par défaut si besoin.
    const savedTenant = localStorage.getItem('last_tenant');
    if (savedTenant) {
      this._activeTenant.set(JSON.parse(savedTenant));
    }
  }

  setTenant(tenant: Tenant): void {
    this._activeTenant.set(tenant);
    localStorage.setItem('last_tenant', JSON.stringify(tenant));
    this.updateBranding(tenant);
  }

  private updateBranding(tenant: Tenant): void {
    if (tenant.primaryColor) {
      document.documentElement.style.setProperty('--fw-primary', tenant.primaryColor);
    }
  }
}
