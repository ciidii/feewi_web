import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BadgeConfig {
  label: string;
  token: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const STATUS_MAP: Record<string, BadgeConfig> = {
  DRAFT:      { label: 'Brouillon',      token: 'neutral' },
  SUBMITTED:  { label: 'Soumis',         token: 'info'    },
  VERIFIED:   { label: 'Vérifié',        token: 'info'    },
  TESTING:    { label: 'En évaluation',  token: 'warning' },
  ADMITTED:   { label: 'Admis',          token: 'success' },
  VALIDATED:  { label: 'Validé',         token: 'success' },
  WAITLIST:   { label: 'Liste d\'attente',token: 'warning' },
  REJECTED:   { label: 'Rejeté',         token: 'error'   },
  CANCELLED:  { label: 'Annulé',         token: 'neutral' },
  ACTIVE:     { label: 'Actif',          token: 'success' },
  SUSPENDED:  { label: 'Suspendu',       token: 'error'   },
  LEFT:       { label: 'Sorti',          token: 'error'   },
  ARCHIVED:   { label: 'Archivé',        token: 'neutral' },
  REQUIRED:   { label: 'Obligatoire',    token: 'error'   },
  PLANNING:   { label: 'Planification',  token: 'info'    },
  CLOSED:     { label: 'Clôturée',       token: 'neutral' },
};

@Component({
  selector: 'app-fw-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="classes()" [title]="status">
      <span class="dot" *ngIf="dot"></span>
      <span class="label" *ngIf="!dot">{{ config().label }}</span>
    </div>
  `,
  styles: [`
    :host { display: inline-block; }

    div {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--fw-radius-full);
      font-family: inherit;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid transparent;
      white-space: nowrap;
      transition: var(--fw-transition-fast);

      &.size-xs { padding: 2px 8px; font-size: 9px; }

      &.token-success {
        background-color: var(--fw-success-bg);
        color: var(--fw-success-text);
        border-color: var(--fw-success-border);
        .dot { background-color: var(--fw-success); }
      }

      &.token-warning {
        background-color: var(--fw-warning-bg);
        color: var(--fw-warning-text);
        border-color: var(--fw-warning-border);
        .dot { background-color: var(--fw-warning); }
      }

      &.token-error {
        background-color: var(--fw-error-bg);
        color: var(--fw-error-text);
        border-color: var(--fw-error-border);
        .dot { background-color: var(--fw-error); }
      }

      &.token-info {
        background-color: var(--fw-info-bg);
        color: var(--fw-info-text);
        border-color: var(--fw-info-border);
        .dot { background-color: var(--fw-info); }
      }

      &.token-neutral {
        background-color: var(--fw-neutral-bg);
        color: var(--fw-neutral-text);
        border-color: var(--fw-neutral-border);
        .dot { background-color: var(--fw-neutral-text); }
      }

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
    }
  `]
})
export class FwBadgeComponent {
  @Input() status!: string;
  @Input() size: 'xs' | 'sm' = 'sm';
  @Input() dot = false;

  config = computed(() => {
    return STATUS_MAP[this.status] || { label: this.status, token: 'neutral' };
  });

  classes = computed(() => {
    const c = this.config();
    return `token-${c.token} size-${this.size} ${this.dot ? 'is-dot' : ''}`;
  });
}
