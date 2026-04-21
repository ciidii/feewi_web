import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FwPageHeaderComponent } from '../page-header/page-header.component';
import { FwTabsComponent, FwTab } from '../tabs/tabs.component';

@Component({
  selector: 'app-fw-page-shell',
  standalone: true,
  imports: [CommonModule, FwPageHeaderComponent, FwTabsComponent],
  template: `
    <div class="page-shell" [class.has-tabs]="tabs && tabs.length > 0">
      
      <!-- HEADER FIXE -->
      <div class="shell-header-area">
        <app-fw-page-header
          [title]="title"
          [description]="description"
          [icon]="icon"
          [backLink]="backLink"
          [density]="density">
          <div actions>
            <ng-content select="[actions]"></ng-content>
          </div>
        </app-fw-page-header>

        <!-- ONGLETS (Optionnels) -->
        <div class="shell-tabs-area" *ngIf="tabs && tabs.length > 0">
          <app-fw-tabs
            [tabs]="tabs"
            [activeTabId]="activeTabId"
            (tabChange)="onTabChange($event)">
          </app-fw-tabs>
        </div>
      </div>

      <!-- CONTENU SCROLLABLE -->
      <main class="shell-body">
        <div class="content-container">
          <ng-content></ng-content>
        </div>
      </main>

    </div>
  `,
  styleUrl: './page-shell.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FwPageShellComponent {
  // Configuration Header
  @Input() title!: string;
  @Input() description?: string;
  @Input() icon?: any;
  @Input() backLink?: string | any[];
  @Input() density: 'comfortable' | 'compact' = 'comfortable';

  // Configuration Navigation
  @Input() tabs: FwTab[] = [];
  @Input() activeTabId: string = '';
  @Output() tabChange = new EventEmitter<string>();

  onTabChange(id: string) {
    this.tabChange.emit(id);
  }
}
