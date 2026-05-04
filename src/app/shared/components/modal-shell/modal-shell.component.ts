import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule, X} from 'lucide-angular';
import {A11yModule} from '@angular/cdk/a11y';

@Component({
  selector: 'app-fw-modal-shell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, A11yModule],
  template: `
    <div class="fw-modal-container animate-in fade-in zoom-in duration-200" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <!-- HEADER -->
      <header class="modal-header">
        <div class="title-zone">
          <h2 class="modal-title" *ngIf="title">{{ title }}</h2>
          <p class="modal-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          <ng-content select="[header-extra]"></ng-content>
        </div>
        <button (click)="close.emit()" class="close-icon-btn" aria-label="Fermer">
          <lucide-icon [name]="XIcon" [size]="20"></lucide-icon>
        </button>
      </header>

      <!-- BODY -->
      <main class="modal-body custom-scrollbar">
        <ng-content></ng-content>
      </main>

      <!-- FOOTER -->
      <footer class="modal-footer" *ngIf="showFooter">
        <div class="footer-left">
          <ng-content select="[footer-left]"></ng-content>
        </div>
        <div class="footer-right">
          <ng-content select="[footer-right]"></ng-content>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 100vw;
    }

    .fw-modal-container {
      display: flex;
      flex-direction: column;
      background: var(--fw-surface-card);
      border-radius: var(--fw-radius-xl);
      overflow: hidden;
      box-shadow: var(--fw-shadow-lg);
      max-height: 90vh;
      border: 1px solid var(--fw-border);
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: var(--fw-space-lg) var(--fw-space-lg) var(--fw-space-md);
      border-bottom: 1px solid var(--fw-border);
      background: var(--fw-surface-card);
      z-index: 10;

      .modal-title {
        font-family: var(--fw-font-display);
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--fw-text-primary);
        margin: 0;
        line-height: 1.2;
      }

      .modal-subtitle {
        font-size: 0.875rem;
        color: var(--fw-text-secondary);
        margin: 4px 0 0 0;
      }
    }

    .close-icon-btn {
      background: transparent;
      border: none;
      color: var(--fw-text-tertiary);
      cursor: pointer;
      padding: 8px;
      border-radius: var(--fw-radius-md);
      transition: var(--fw-transition-fast);
      margin-top: -4px;
      margin-right: -4px;

      &:hover {
        background: var(--fw-surface-sunken);
        color: var(--fw-text-primary);
      }
    }

    .modal-body {
      flex: 1;
      padding: var(--fw-space-lg);
      overflow-y: auto;
      background: var(--fw-surface-page);
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--fw-space-md) var(--fw-space-lg);
      background: var(--fw-surface-card);
      border-top: 1px solid var(--fw-border);
      gap: 12px;
      z-index: 10;
    }

    .footer-right {
      display: flex;
      gap: 12px;
      margin-left: auto;
    }

    /* Scrollbar personnalisée pour la modale */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--fw-border-strong);
      border-radius: 10px;
    }
  `]
})
export class FwModalShellComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() showFooter = true;

  @Output() close = new EventEmitter<void>();

  readonly XIcon = X;
  @HostListener('window:keydown.escape')
  onEscape() {
    this.close.emit();
  }
}
