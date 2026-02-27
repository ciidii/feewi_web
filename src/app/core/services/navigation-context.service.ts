import { Injectable, signal, inject, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type AppDomain = 'saas' | 'school' | 'public';

@Injectable({
  providedIn: 'root',
})
export class NavigationContextService {
  private router = inject(Router);

  // Signal du domaine actuel
  private _currentDomain = signal<AppDomain>('public');
  readonly currentDomain = this._currentDomain.asReadonly();

  // Helpers pour les templates
  readonly isSaasDomain = computed(() => this._currentDomain() === 'saas');
  readonly isSchoolDomain = computed(() => this._currentDomain() === 'school');

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      if (url.startsWith('/saas')) {
        this._currentDomain.set('saas');
      } else if (url.startsWith('/auth')) {
        this._currentDomain.set('public');
      } else {
        this._currentDomain.set('school');
      }
    });
  }
}
