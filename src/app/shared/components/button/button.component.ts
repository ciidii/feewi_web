import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';
import { Component, computed, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive';
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
      border: 1.5px solid transparent;
      cursor: pointer;
      transition: var(--fw-transition-fast);
      white-space: nowrap;
      position: relative;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Navigation Clavier (Impératif 6) */
      &:focus-visible {
        outline: 2px solid var(--fw-primary);
        outline-offset: 2px;
      }

      // VARIANTES (Impératif 4)
      
      &.variant-primary {
        background-color: var(--fw-primary);
        color: var(--fw-text-inverse);
        &:hover:not(:disabled) { background-color: var(--fw-primary-hover); transform: translateY(-1px); }
      }

      &.variant-secondary {
        background-color: var(--fw-surface-inverse);
        color: var(--fw-text-inverse);
        &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
      }

      &.variant-tertiary {
        background-color: var(--fw-surface-sunken);
        color: var(--fw-text-secondary);
        border-color: var(--fw-border);
        &:hover:not(:disabled) { background-color: var(--fw-white); color: var(--fw-text-primary); border-color: var(--fw-primary); }
      }

      &.variant-ghost {
        background-color: transparent;
        color: var(--fw-text-secondary);
        &:hover:not(:disabled) { background-color: var(--fw-surface-sunken); color: var(--fw-primary); }
      }

      &.variant-destructive {
        background-color: var(--fw-destructive);
        color: var(--fw-text-inverse);
        &:hover:not(:disabled) { background-color: var(--fw-destructive-hover); box-shadow: 0 4px 12px var(--fw-destructive-bg); }
      }

      // TAILLES (Gestion de la densité via variables CSS)
      &.size-sm { 
        height: 32px; 
        padding: 0 var(--fw-space-sm); 
        font-size: 0.75rem; 
        gap: 6px; 
      }
      &.size-md { 
        height: 44px; 
        padding: 0 var(--fw-space-md); 
        font-size: 0.875rem; 
      }
      &.size-lg { 
        height: 56px; 
        padding: 0 var(--fw-space-lg); 
        font-size: 1rem; 
        border-radius: var(--fw-radius-lg); 
      }
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
      case 'lg': return 20;
      default: return 18;
    }
  });

  onClick(event: Event) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
