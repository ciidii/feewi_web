import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Back to normal behavior (no artificial delay).
  private readonly minVisibleMs = 0;
  private loadingCount = signal(0);
  private visibleSince = 0;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private slowTimeoutId: ReturnType<typeof setTimeout> | null = null;

  isLoading = signal(false);
  isSlowLoading = signal(false);

  start(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    this.loadingCount.update((count) => {
      const newCount = count + 1;
      if (count === 0) {
        this.visibleSince = Date.now();
        this.isLoading.set(true);
        
        // Déclencher la détection de lenteur (8 secondes)
        this.slowTimeoutId = setTimeout(() => {
          if (this.isLoading()) {
            this.isSlowLoading.set(true);
          }
        }, 8000);
      }
      return newCount;
    });
  }

  stop(): void {
    this.loadingCount.update((count) => {
      const newCount = Math.max(0, count - 1);
      if (newCount !== 0) {
        return newCount;
      }

      // Nettoyer le timer de lenteur
      if (this.slowTimeoutId) {
        clearTimeout(this.slowTimeoutId);
        this.slowTimeoutId = null;
      }
      this.isSlowLoading.set(false);

      const elapsed = Date.now() - this.visibleSince;
      const remaining = Math.max(0, this.minVisibleMs - elapsed);

      if (remaining === 0) {
        this.isLoading.set(false);
      } else {
        this.hideTimeoutId = setTimeout(() => {
          this.isLoading.set(false);
          this.hideTimeoutId = null;
        }, remaining);
      }

      return newCount;
    });
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.start();
    try {
      return await fn();
    } finally {
      this.stop();
    }
  }

  reset(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
    if (this.slowTimeoutId) {
      clearTimeout(this.slowTimeoutId);
      this.slowTimeoutId = null;
    }
    this.loadingCount.set(0);
    this.isLoading.set(false);
    this.isSlowLoading.set(false);
  }
}
