import {Component, computed, Input, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';

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
  PENDING:    { label: 'En attente',     token: 'info'    },
  ELIGIBLE:   { label: 'Éligible',       token: 'success' },
  INELIGIBLE: { label: 'Non éligible',   token: 'error'   },
  READY:      { label: 'Prêt',           token: 'success' },
  DELIVERED:  { label: 'Remis',          token: 'neutral' },
};

@Component({
  selector: 'app-fw-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="classes()" [title]="status || labelOverride || ''" class="fw-badge">
      <span class="dot" *ngIf="dot"></span>
      <span class="label" *ngIf="!dot">{{ config().label }}</span>
    </div>
  `,
  styleUrl: './badge.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FwBadgeComponent {
  @Input() status?: string;
  @Input() labelOverride?: string;
  @Input() tokenOverride?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  @Input() size: 'xs' | 'sm' = 'sm';
  @Input() dot = false;

  config = computed(() => {
    if (this.labelOverride) {
      return { label: this.labelOverride, token: this.tokenOverride || 'neutral' };
    }
    return STATUS_MAP[this.status || ''] || { label: this.status || '', token: 'neutral' };
  });

  classes = computed(() => {
    const c = this.config();
    const token = this.tokenOverride || c.token;
    return `token-${token} size-${this.size} ${this.dot ? 'is-dot' : ''}`;
  });
}
