import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavigationStateService {
  // Signal de l'├®tat de la sidebar (true = ├®tendue, false = r├®duite)
  private _isSidebarExpanded = signal<boolean>(true);
  private _isRailExpanded = signal<boolean>(false);

  // Exposition du signal en lecture seule
  readonly isSidebarExpanded = this._isSidebarExpanded.asReadonly();
  readonly isRailExpanded = this._isRailExpanded.asReadonly();

  // Signal pour le fil d'ariane (Breadcrumb)
  private _breadcrumb = signal<string[]>(['Accueil']);
  readonly breadcrumb = this._breadcrumb.asReadonly();

  // Signal pour le service actif (Microservice s├®lectionn├®)
  private _activeService = signal<string>('dashboard');
  readonly activeService = this._activeService.asReadonly();

  toggleSidebar(): void {
    this._isSidebarExpanded.update((v) => !v);
  }

  toggleRail(): void {
    this._isRailExpanded.update((v) => !v);
  }

  setRailExpanded(state: boolean): void {
    this._isRailExpanded.set(state);
  }

  setActiveService(service: string): void {
    this._activeService.set(service);
  }

  setSidebarExpanded(state: boolean): void {
    this._isSidebarExpanded.set(state);
  }

  setBreadcrumb(path: string[]): void {
    this._breadcrumb.set(path);
  }

  addBreadcrumbItem(item: string): void {
    this._breadcrumb.update((items) => [...items, item]);
  }
}
