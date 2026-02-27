import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AppRailComponent } from './app-rail.component';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, AppRailComponent, SidebarComponent],
  template: `
    <div class="flex flex-col h-screen overflow-hidden bg-white selection:bg-primary selection:text-white antialiased">
      <!-- Header Supérieur -->
      <app-header></app-header>

      <!-- Corps de l'application -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Rail de Navigation (Extrême Gauche) -->
        <app-rail></app-rail>

        <!-- Sidebar du Module (Collapsible) -->
        <app-sidebar></app-sidebar>

        <!-- Zone de Contenu Principale -->
        <main class="flex-1 overflow-y-auto bg-ice/50 relative">
          <div class="p-8 max-w-[1600px] mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {}
