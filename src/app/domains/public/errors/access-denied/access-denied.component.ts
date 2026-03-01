import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShieldAlert, Lock, Home } from 'lucide-angular';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-white flex items-center justify-center p-6">
      <div class="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- Illustration -->
        <div class="relative inline-flex">
          <div class="w-32 h-32 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm">
            <lucide-icon [name]="Lock" class="w-16 h-16"></lucide-icon>
          </div>
          <div class="absolute -top-2 -right-2 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md">
            <lucide-icon [name]="ShieldAlert" class="w-5 h-5 text-rose-500"></lucide-icon>
          </div>
        </div>

        <!-- Text -->
        <div class="space-y-3">
          <h1 class="text-3xl font-display font-extrabold text-midnight tracking-tight">Accès Restreint</h1>
          <div class="space-y-2">
            <p class="text-slate-600 font-bold text-sm uppercase tracking-widest">Erreur 403 • Forbidden</p>
            <p class="text-slate-500 font-medium leading-relaxed">
              Vos droits d'accès actuels ne vous permettent pas de consulter cette ressource. Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur.
            </p>
          </div>
        </div>

        <!-- Info Box -->
        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-left">
          <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
            <lucide-icon [name]="ShieldAlert" class="w-4 h-4 text-slate-400"></lucide-icon>
          </div>
          <div>
            <p class="text-[11px] font-bold text-slate-700 uppercase">Sécurité SaaS Feewi</p>
            <p class="text-[11px] text-slate-500">Cette tentative d'accès a été enregistrée dans nos journaux de sécurité pour des raisons de conformité.</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-4">
          <button routerLink="/" class="w-full flex items-center justify-center gap-2 h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95">
            <lucide-icon [name]="Home" class="w-4 h-4"></lucide-icon>
            Retourner au tableau de bord
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .font-display { font-family: 'Lexend', sans-serif; }
  `]
})
export class AccessDeniedComponent {
  readonly Lock = Lock;
  readonly ShieldAlert = ShieldAlert;
  readonly Home = Home;
}
