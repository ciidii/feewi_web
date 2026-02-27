import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavigationStateService {
  // Signal de l'état de la sidebar (true = étendue, false = réduite)
  private _isSidebarExpanded = signal<boolean>(true);

  // Exposition du signal en lecture seule
  readonly isSidebarExpanded = this._isSidebarExpanded.asReadonly();

  // Signal pour le fil d'ariane (Breadcrumb)
  private _breadcrumb = signal<string[]>(['Accueil']);
  readonly breadcrumb = this._breadcrumb.asReadonly();

  toggleSidebar(): void {
    this._isSidebarExpanded.update((v) => !v);
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
