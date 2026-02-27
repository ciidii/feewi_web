import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantContextService } from '../services/tenant-context.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, Search, Grid, Bell, User, CalendarDays, ChevronDown } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, LucideAngularModule],
  template: `
    <header class="h-16 border-b border-border-subtle bg-white flex items-center justify-between px-4 sticky top-0 z-50">
      <!-- Gauche : Logo & Tenant -->
      <div class="flex items-center gap-3 w-72">
        <div class="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm">
          F
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-midnight leading-tight truncate">
            {{ tenantService.activeTenant()?.name }}
          </span>
          <span class="text-[10px] text-slate-medium uppercase tracking-wider font-medium">
            Écosystème Feewi
          </span>
        </div>
      </div>

      <!-- Centre : Omnisearch -->
      <div class="flex-1 max-w-2xl px-4">
        <div class="relative group">
          <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
            <lucide-icon [name]="Search" class="w-4 h-4 text-slate-medium"></lucide-icon>
          </div>
          <input 
            type="text" 
            placeholder="Rechercher un élève, un enseignant ou une action (Ctrl+K)" 
            class="w-full bg-ice border-none rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:bg-white focus:shadow-sm transition-all outline-none"
          />
        </div>
      </div>

      <!-- Droite : Sélecteur d'Année & Actions -->
      <div class="flex items-center gap-1 w-auto min-w-[300px] justify-end">
        
        <!-- Sélecteur d'Année Scolaire (Nouveauté) -->
        <button class="flex items-center gap-2 px-3 py-1.5 hover:bg-ice rounded-full transition-all border border-border-subtle group mr-2">
          <lucide-icon [name]="CalendarDays" class="w-4 h-4 text-primary"></lucide-icon>
          <span class="text-xs font-bold text-midnight tracking-tight">2024 - 2025</span>
          <lucide-icon [name]="ChevronDown" class="w-3.5 h-3.5 text-slate-medium group-hover:translate-y-0.5 transition-transform"></lucide-icon>
        </button>

        <div class="h-6 w-[1px] bg-border-subtle mx-1"></div>

        <button mat-icon-button class="text-slate-medium hover:text-midnight transition-colors">
          <lucide-icon [name]="Bell" class="w-5 h-5"></lucide-icon>
        </button>
        <button mat-icon-button class="text-slate-medium hover:text-midnight transition-colors">
          <lucide-icon [name]="Grid" class="w-5 h-5"></lucide-icon>
        </button>
        <div class="h-8 w-[1px] bg-border-subtle mx-2"></div>
        <button class="flex items-center gap-2 p-1 pl-2 hover:bg-ice rounded-full transition-all border border-transparent hover:border-border-subtle group">
          <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-white transition-colors">
            <lucide-icon [name]="User" class="w-4 h-4 text-slate-medium group-hover:text-primary transition-colors"></lucide-icon>
          </div>
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  tenantService = inject(TenantContextService);
  readonly Search = Search;
  readonly Grid = Grid;
  readonly Bell = Bell;
  readonly User = User;
  readonly CalendarDays = CalendarDays;
  readonly ChevronDown = ChevronDown;
}
