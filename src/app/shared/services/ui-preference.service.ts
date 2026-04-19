import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'high-contrast' | 'system';
export type AppDensity = 'comfortable' | 'compact';

@Injectable({
  providedIn: 'root'
})
export class UiPreferenceService {
  // Signals d'état
  theme = signal<AppTheme>(this.getStoredTheme());
  density = signal<AppDensity>(this.getStoredDensity());

  constructor() {
    // Effet pour appliquer les changements au DOM automatiquement
    effect(() => {
      const currentTheme = this.theme();
      const currentDensity = this.density();

      // Gestion du thème
      let themeToApply = currentTheme;
      if (currentTheme === 'system') {
        themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      document.documentElement.setAttribute('data-theme', themeToApply);
      document.documentElement.setAttribute('data-density', currentDensity);
      
      // Persistance
      localStorage.setItem('fw-theme', currentTheme);
      localStorage.setItem('fw-density', currentDensity);
    });
  }

  toggleDensity() {
    this.density.update(d => d === 'comfortable' ? 'compact' : 'comfortable');
  }

  setTheme(newTheme: AppTheme) {
    this.theme.set(newTheme);
  }

  private getStoredTheme(): AppTheme {
    return (localStorage.getItem('fw-theme') as AppTheme) || 'system';
  }

  private getStoredDensity(): AppDensity {
    return (localStorage.getItem('fw-density') as AppDensity) || 'comfortable';
  }
}
