import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, Home, Settings, Briefcase, GraduationCap, LayoutGrid } from 'lucide-angular';

@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [CommonModule, MatButtonModule, LucideAngularModule],
  template: `
    <nav class="w-16 h-[calc(100vh-64px)] bg-slate-50 border-r border-border-subtle flex flex-col items-center py-4 gap-2 transition-all select-none">
      
      <!-- Item: Dashboard -->
      <a 
        class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group relative"
        [class.text-primary]="true"
        title="Tableau de bord"
      >
        <div class="absolute left-0 w-1 h-6 bg-primary rounded-r-full hidden group-[.active]:block"></div>
        <lucide-icon [name]="Home" class="w-5 h-5 group-hover:scale-110 transition-transform"></lucide-icon>
        <span class="text-[9px] font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100">Accueil</span>
      </a>

      <div class="w-8 h-[1px] bg-border-subtle my-1"></div>

      <!-- Item: Admissions -->
      <a 
        class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-medium hover:bg-white hover:text-primary transition-all cursor-pointer group"
        title="Admissions"
      >
        <lucide-icon [name]="Briefcase" class="w-5 h-5 group-hover:scale-110 transition-transform"></lucide-icon>
        <span class="text-[9px] font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100">Inscrits</span>
      </a>

      <!-- Item: Registry -->
      <a 
        class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-medium hover:bg-white hover:text-primary transition-all cursor-pointer group"
        title="Scolarité"
      >
        <lucide-icon [name]="GraduationCap" class="w-5 h-5 group-hover:scale-110 transition-transform"></lucide-icon>
        <span class="text-[9px] font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100">Scolarité</span>
      </a>

      <!-- Item: Modules -->
      <a 
        class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-medium hover:bg-white hover:text-primary transition-all cursor-pointer group"
        title="Tous les modules"
      >
        <lucide-icon [name]="LayoutGrid" class="w-5 h-5 group-hover:scale-110 transition-transform"></lucide-icon>
        <span class="text-[9px] font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100">Modules</span>
      </a>

      <!-- Bottom: Settings -->
      <div class="mt-auto">
        <a 
          class="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-medium hover:bg-white hover:text-primary transition-all cursor-pointer group"
          title="Paramètres"
        >
          <lucide-icon [name]="Settings" class="w-5 h-5 group-hover:rotate-45 transition-transform"></lucide-icon>
          <span class="text-[9px] font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100">Réglages</span>
        </a>
      </div>
    </nav>
  `,
})
export class AppRailComponent {
  readonly Home = Home;
  readonly Settings = Settings;
  readonly Briefcase = Briefcase;
  readonly GraduationCap = GraduationCap;
  readonly LayoutGrid = LayoutGrid;
}
