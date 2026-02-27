import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationStateService } from '../services/navigation-state.service';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, ChevronLeft, ChevronRight, Plus, Users, School, Calendar, BookOpen, FileText, Briefcase } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, LucideAngularModule, RouterModule],
  template: `
    <aside 
      class="bg-white border-r border-border-subtle h-[calc(100vh-64px)] transition-all duration-300 relative flex flex-col overflow-hidden select-none"
      [class.w-72]="navService.isSidebarExpanded()"
      [class.w-20]="!navService.isSidebarExpanded()"
    >
      <!-- Hero Button Section -->
      <div class="p-4 flex justify-center shrink-0">
        <button 
          routerLink="/admissions"
          class="flex items-center bg-white border border-border-subtle shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl h-14 w-full group active:scale-95 overflow-hidden"
          [class.justify-center]="!navService.isSidebarExpanded()"
          [class.px-6]="navService.isSidebarExpanded()"
        >
          <lucide-icon [name]="Plus" class="w-6 h-6 text-primary stroke-[3px] group-hover:rotate-90 transition-transform shrink-0"></lucide-icon>
          <span 
            *ngIf="navService.isSidebarExpanded()" 
            class="ml-3 text-sm font-bold text-midnight whitespace-nowrap opacity-100 transition-opacity duration-200"
          >
            Nouvelle Inscription
          </span>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
        <a 
          *ngFor="let item of navItems" 
          [routerLink]="item.route"
          routerLinkActive="bg-ice text-primary font-bold border-r-2 border-primary"
          class="flex items-center h-11 px-4 rounded-lg text-slate-medium hover:bg-ice hover:text-primary transition-all group relative border-r-2 border-transparent overflow-hidden"
          [class.justify-center]="!navService.isSidebarExpanded()"
        >
          <lucide-icon [name]="item.icon" class="w-5 h-5 shrink-0 stroke-[1.5px] group-hover:scale-110 transition-transform"></lucide-icon>
          <span 
            *ngIf="navService.isSidebarExpanded()" 
            class="ml-4 text-sm font-medium whitespace-nowrap opacity-100 transition-opacity duration-200"
          >
            {{ item.label }}
          </span>
          <!-- Tooltip en mode réduit -->
          <div 
            *ngIf="!navService.isSidebarExpanded()" 
            class="absolute left-16 bg-midnight text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg whitespace-nowrap"
          >
            {{ item.label }}
          </div>
        </a>
      </nav>

      <!-- Footer Toggle -->
      <div class="p-3 border-t border-border-subtle flex justify-end shrink-0">
        <button 
          (click)="navService.toggleSidebar()"
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ice text-slate-medium transition-colors active:bg-slate-200"
        >
          <lucide-icon [name]="navService.isSidebarExpanded() ? ChevronLeft : ChevronRight" class="w-4 h-4"></lucide-icon>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  navService = inject(NavigationStateService);
  readonly Plus = Plus;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  navItems = [
    { label: 'Admissions', icon: Briefcase, route: '/admissions' },
    { label: 'Classes', icon: School, route: '/classes' },
    { label: 'Élèves', icon: Users, route: '/students' },
    { label: 'Emplois du temps', icon: Calendar, route: '/schedule' },
    { label: 'Examens', icon: BookOpen, route: '/exams' },
    { label: 'Rapports', icon: FileText, route: '/reports' },
  ];
}
