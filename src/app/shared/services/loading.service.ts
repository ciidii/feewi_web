import { Injectable, signal } from '@angular/core';

export type LoadingContext = 'global' | 'page' | 'component' | 'none';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = signal(0);
  private currentContext = signal<LoadingContext>('none');
  private slowTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  isLoading = signal(false);
  isSlowLoading = signal(false); // Restauré pour la compatibilité
  context = this.currentContext.asReadonly();

  /**
   * Démarre un chargement avec un contexte spécifique
   * @param context 'global', 'page' ou 'component'
   */
  start(context: LoadingContext = 'global'): void {
    if (this.loadingCount() === 0) {
      this.isLoading.set(true);
      this.currentContext.set(context);
      
      // Déclencher la détection de lenteur (5 secondes)
      this.slowTimeoutId = setTimeout(() => {
        if (this.isLoading()) {
          this.isSlowLoading.set(true);
        }
      }, 5000);
    }
    this.loadingCount.update(c => c + 1);
  }

  /**
   * Arrête le chargement
   */
  stop(): void {
    this.loadingCount.update(c => {
      const next = Math.max(0, c - 1);
      if (next === 0) {
        this.isLoading.set(false);
        this.isSlowLoading.set(false);
        this.currentContext.set('none');
        
        if (this.slowTimeoutId) {
          clearTimeout(this.slowTimeoutId);
          this.slowTimeoutId = null;
        }
      }
      return next;
    });
  }

  /**
   * Helper pour exécuter une tâche asynchrone dans un contexte
   */
  async execute<T>(fn: () => Promise<T>, context: LoadingContext = 'component'): Promise<T> {
    this.start(context);
    try {
      return await fn();
    } finally {
      this.stop();
    }
  }
}
