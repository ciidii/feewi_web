import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, SearchX, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div class="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <!-- Illustration / Icon -->
        <div class="relative inline-flex">
          <div class="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
            <lucide-icon [name]="SearchX" class="w-16 h-16"></lucide-icon>
          </div>
          <div class="absolute -top-2 -right-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
            <span class="text-sm font-bold text-slate-900 font-mono">404</span>
          </div>
        </div>

        <!-- Text -->
        <div class="space-y-3">
          <h1 class="text-3xl font-display font-extrabold text-midnight tracking-tight">Page Introuvable</h1>
          <p class="text-slate-500 font-medium">
            Désolé, l'adresse que vous avez saisie n'existe pas ou a été déplacée définitivement.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3 pt-4">
          <button routerLink="/" class="flex items-center justify-center gap-2 h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
            <lucide-icon [name]="Home" class="w-4 h-4"></lucide-icon>
            Retourner à l'accueil
          </button>
          
          <button (click)="goBack()" class="flex items-center justify-center gap-2 h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95">
            <lucide-icon [name]="ArrowLeft" class="w-4 h-4"></lucide-icon>
            Revenir en arrière
          </button>
        </div>

        <!-- Footer -->
        <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Feewi SaaS • C'est en ordre
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .font-display { font-family: 'Lexend', sans-serif; }
  `]
})
export class NotFoundComponent {
  readonly SearchX = SearchX;
  readonly Home = Home;
  readonly ArrowLeft = ArrowLeft;

  goBack() {
    window.history.back();
  }
}
