import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-fw-page-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="page-header animate-fade" [class.compact]="density === 'compact'">
      <div class="header-main">
        <!-- Icône de Page -->
        <div class="icon-container" *ngIf="icon">
          <lucide-icon [name]="icon" [size]="density === 'compact' ? 18 : 24"></lucide-icon>
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
  styles: [`
    .page-header {
      height: 104px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--fw-space-xl);
      background: var(--fw-surface-card);
      border-bottom: 1px solid var(--fw-border);
      font-family: var(--fw-font-sans);
      transition: var(--fw-transition);

      &.compact {
        height: 72px;
        .icon-container { width: 40px; height: 40px; border-radius: var(--fw-radius-md); }
        .page-title { font-size: 1.125rem; }
        .page-desc { display: none; }
      }
    }

    .header-main {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .icon-container {
      width: 52px;
      height: 52px;
      background: var(--fw-surface-sunken);
      color: var(--fw-primary);
      border-radius: var(--fw-radius-lg);
      display: grid;
      place-items: center;
      transition: var(--fw-transition);
    }

    .titles {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .page-title {
        font-family: var(--fw-font-display);
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--fw-text-primary);
        letter-spacing: -0.02em;
        margin: 0;
        line-height: 1.1;
      }

      .page-desc {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--fw-text-tertiary);
        margin: 0;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    @keyframes fade { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade { animation: fade 0.3s ease-out; }

    @media (max-width: 768px) {
      .page-header { 
        padding: 24px var(--fw-space-md); 
        height: auto; 
        flex-direction: column; 
        align-items: flex-start; 
        gap: 20px; 
      }
      .header-actions { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class FwPageHeaderComponent {
  @Input() icon?: any;
  @Input() title!: string;
  @Input() description?: string;
  @Input() density: 'comfortable' | 'compact' = 'comfortable';
}
