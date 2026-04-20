import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';
import { Component, computed, Input, ViewEncapsulation } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'destructive' | 'tertiary';
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
      class="fw-btn"
    >
      <!-- Spinner -->
      <lucide-icon
        *ngIf="loading"
        [name]="Loader2"
        class="animate-spin"
        [size]="iconSize()"
      ></lucide-icon>

      <!-- Ic├┤ne Gauche -->
      <lucide-icon
        *ngIf="!loading && icon && iconPosition === 'left'"
        [name]="icon"
        [size]="iconSize()"
      ></lucide-icon>

      <!-- Contenu -->
      <span class="btn-content" [class.opacity-0]="loading && hideContentOnLoading">
        <ng-content></ng-content>
      </span>

      <!-- Ic├┤ne Droite -->
      <lucide-icon
        *ngIf="!loading && icon && iconPosition === 'right'"
        [name]="icon"
        [size]="iconSize()"
      ></lucide-icon>
    </button>
  `,
  styleUrl: './button.component.scss',
  encapsulation: ViewEncapsulation.None
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
