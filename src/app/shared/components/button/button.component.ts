
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';
import {Component, computed, Input} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-fw-button',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="classes()"
      (click)="onClick($event)"
    >
      <!-- Spinner -->
      <lucide-icon
        *ngIf="loading"
        [name]="Loader2"
        class="animate-spin"
        [size]="iconSize()"
      ></lucide-icon>

      <!-- Icône Gauche -->
      <lucide-icon
        *ngIf="!loading && icon && iconPosition === 'left'"
        [name]="icon"
        [size]="iconSize()"
      ></lucide-icon>

      <!-- Contenu -->
      <span class="btn-content" [class.opacity-0]="loading && hideContentOnLoading">
        <ng-content></ng-content>
      </span>

      <!-- Icône Droite -->
      <lucide-icon
        *ngIf="!loading && icon && iconPosition === 'right'"
        [name]="icon"
        [size]="iconSize()"
      ></lucide-icon>
    </button>
  `,
  styles: [`
    :host { display: inline-block; width: auto; }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: var(--fw-font-sans);
      font-weight: 700;
      border-radius: var(--fw-radius-md);
      border: none;
      cursor: pointer;
      transition: var(--fw-transition-fast);
      white-space: nowrap;
      position: relative;
      outline: none;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:focus-visible {
        box-shadow: 0 0 0 3px var(--fw-primary-alpha);
      }

      // VARIANTES
      &.variant-primary {
        background-color: var(--fw-surface-inverse);
        color: var(--fw-text-inverse);
        &:hover:not(:disabled) { background-color: #1e293b; transform: translateY(-1px); }
        &:active:not(:disabled) { transform: translateY(0); }
      }

      &.variant-secondary {
        background-color: var(--fw-surface-sunken);
        color: var(--fw-text-secondary);
        border: 1px solid var(--fw-border);
        &:hover:not(:disabled) { background-color: #e2e8f0; color: var(--fw-text-primary); }
      }

      &.variant-ghost {
        background-color: transparent;
        color: var(--fw-text-secondary);
        &:hover:not(:disabled) { background-color: var(--fw-interactive-subtle); color: var(--fw-primary); }
      }

      &.variant-danger {
        background-color: var(--fw-error);
        color: white;
        &:hover:not(:disabled) { background-color: #b91c1c; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
      }

      // TAILLES
      &.size-sm { height: 32px; padding: 0 12px; font-size: 0.75rem; gap: 6px; }
      &.size-md { height: 44px; padding: 0 20px; font-size: 0.875rem; gap: 8px; }
      &.size-lg { height: 56px; padding: 0 28px; font-size: 1rem; gap: 10px; border-radius: var(--fw-radius-lg); }
    }

    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class FwButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() icon?: any;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() hideContentOnLoading = false;

  readonly Loader2 = Loader2;

  classes = computed(() => {
    return `variant-${this.variant} size-${this.size} ${this.loading ? 'is-loading' : ''}`;
  });

  iconSize = computed(() => {
    switch (this.size) {
      case 'sm': return 14;
      case 'lg': return 18;
      default: return 16;
    }
  });

  onClick(event: Event) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
