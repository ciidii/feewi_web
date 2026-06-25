import {computed, inject, Injectable, signal} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {NavigationStateService} from './navigation-state.service';

export type AppDomain = 'saas' | 'school' | 'public';

@Injectable({
  providedIn: 'root',
})
export class NavigationContextService {
  private router = inject(Router);
  private navState = inject(NavigationStateService);

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

      // 1. Détermination du Domaine
      if (url.startsWith('/saas')) {
        this._currentDomain.set('saas');
        this.navState.setActiveService('saas');
      } else if (url.startsWith('/auth')) {
        this._currentDomain.set('public');
      } else {
        this._currentDomain.set('school');

        // 2. Détermination du Service Actif (School App)
        if (url.startsWith('/admin/home') || url.startsWith('/admin/dashboard')) {
          this.navState.setActiveService('dashboard');
        } else if (url.startsWith('/admin/admissions')) {
          this.navState.setActiveService('enrollment');
        } else if (url.startsWith('/admin/registry')) {
          this.navState.setActiveService('registry');
        } else if (url.startsWith('/admin/academic') || url.startsWith('/admin/classes')) {
          this.navState.setActiveService('academic');
        } else if (url.startsWith('/admin/identity')) {
          this.navState.setActiveService('identity');
        } else if (url.startsWith('/admin/documents')) {
          this.navState.setActiveService('documents');
        } else if (url.startsWith('/admin/settings')) {
          this.navState.setActiveService('settings');
        }
      }
    });
  }
}
