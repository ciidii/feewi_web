import { Injectable, signal, computed } from '@angular/core';

export interface Tenant {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
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
    // Initialisation par défaut (Mock pour le développement)
    this.setTenant({
      id: 'default-school',
      name: 'Établissement Feewi',
      primaryColor: '#2563EB',
    });
  }

  setTenant(tenant: Tenant): void {
    this._activeTenant.set(tenant);
    this.updateBranding(tenant);
  }

  private updateBranding(tenant: Tenant): void {
    if (tenant.primaryColor) {
      document.documentElement.style.setProperty('--feewi-primary', tenant.primaryColor);
    }
  }
}
