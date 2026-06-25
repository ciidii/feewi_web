import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule, RefreshCcw, ServerCrash, WifiOff} from 'lucide-angular';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div class="max-w-md w-full space-y-8 animate-in fade-in duration-500">
        <!-- Illustration -->
        <div class="w-32 h-32 bg-amber-100 rounded-full mx-auto flex items-center justify-center text-amber-600 shadow-inner">
          <lucide-icon [name]="ServerCrash" class="w-16 h-16"></lucide-icon>
        </div>

        <!-- Text -->
        <div class="space-y-3">
          <h1 class="text-3xl font-display font-extrabold text-midnight tracking-tight">Erreur Serveur</h1>
          <p class="text-slate-500 font-medium">
            Nous rencontrons actuellement une difficulté technique de notre côté. Nos équipes ont été alertées.
          </p>
        </div>

        <!-- Details -->
        <div class="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-3 text-left">
          <lucide-icon [name]="WifiOff" class="w-5 h-5 text-amber-500"></lucide-icon>
          <span class="text-xs font-semibold text-amber-800 uppercase tracking-tighter">API Gateway Inaccessible (500)</span>
        </div>

        <!-- Actions -->
        <div class="pt-4">
          <button (click)="retry()" class="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
            <lucide-icon [name]="RefreshCcw" class="w-4 h-4" [class.animate-spin]="isRetrying"></lucide-icon>
            {{ isRetrying ? 'Tentative en cours...' : 'Réessayer maintenant' }}
          </button>
        </div>

        <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Statut des services : <span class="text-rose-500">Incident</span>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .font-display { font-family: 'Lexend', sans-serif; }
  `]
})
export class ServerErrorComponent {
  readonly ServerCrash = ServerCrash;
  readonly RefreshCcw = RefreshCcw;
  readonly WifiOff = WifiOff;

  isRetrying = false;

  retry() {
    this.isRetrying = true;
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}
