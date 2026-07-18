import {Component, inject, Input, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ArrowLeft, LucideAngularModule, Search} from 'lucide-angular';
import {RouterModule} from '@angular/router';
import {NavigationContextService} from '../../../core/services/navigation-context.service';

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
        <div class="titles" *ngIf="title">
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-desc" *ngIf="description">{{ description }}</p>
        </div>
      </div>

      <!-- Omnisearch -->
      <div class="header-search" *ngIf="showSearch">
        <div class="search-input-wrap">
          <lucide-icon [name]="Search" [size]="14" class="search-icon"></lucide-icon>
          <input
            type="text"
            class="fw-search-input"
            [placeholder]="contextService.isSaasDomain() ? 'Rechercher un établissement...' : 'Rechercher élève, dossier, staff...'"
          />
          <div class="search-kbd">
            <kbd>⌘</kbd><kbd>K</kbd>
          </div>
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
  protected contextService = inject(NavigationContextService);

  @Input() icon?: any;
  @Input() title!: string;
  @Input() description?: string;
  @Input() backLink?: string | any[];
  @Input() density: 'comfortable' | 'compact' = 'comfortable';
  @Input() showSearch: boolean = true;

  readonly ArrowLeft = ArrowLeft;
  readonly Search = Search;
}
