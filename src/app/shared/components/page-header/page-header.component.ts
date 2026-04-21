import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fw-page-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  template: `
    <div class="page-header animate-fade" [class.compact]="density === 'compact'">
      <div class="header-main">
        <!-- Bouton Retour -->
        <a *ngIf="backLink" [routerLink]="backLink" class="btn-back" title="Retour">
          <lucide-icon [name]="ArrowLeft" [size]="18"></lucide-icon>
        </a>

        <!-- Icône de Page -->
        <div class="icon-container" *ngIf="icon">
          <lucide-icon [name]="icon" [size]="density === 'compact' ? 18 : 22"></lucide-icon>
        </div>
        
        <!-- Titres -->
        <div class="titles">
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-desc" *ngIf="description">{{ description }}</p>
        </div>
      </div>

      <!-- Actions de Page (Slot) -->
      <div class="header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './page-header.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FwPageHeaderComponent {
  @Input() icon?: any;
  @Input() title!: string;
  @Input() description?: string;
  @Input() backLink?: string | any[];
  @Input() density: 'comfortable' | 'compact' = 'comfortable';

  readonly ArrowLeft = ArrowLeft;
}
