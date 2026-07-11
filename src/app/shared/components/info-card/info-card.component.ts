import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';

/**
 * Carte d'information standard (icône + titre [+ sous-titre] dans un en-tête, contenu libre
 * dans le corps). Remplace les 4 variantes locales redondantes trouvées dans l'audit
 * (.dossier-card / .detail-card / .info-card / .fw-standard-card) — voir design/UI_UX_STRATEGY.md.
 *
 * Le corps utilise les paires .info-label/.info-value (définies globalement dans styles.scss)
 * pour les champs libellé/valeur.
 */
@Component({
  selector: 'app-fw-info-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section class="fw-info-card" [class.accent-primary]="accent === 'primary'">
      <header class="card-header" *ngIf="!noHeader">
        <div class="header-left" *ngIf="title">
          <lucide-icon *ngIf="icon" [name]="icon" [size]="16" class="header-icon"></lucide-icon>
          <div class="titles">
            <h3 class="card-title">{{ title }}</h3>
            <p class="card-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <ng-content select="[header-left]"></ng-content>
        <div class="header-actions">
          <ng-content select="[card-actions]"></ng-content>
        </div>
      </header>
      <div class="card-body" [class.no-padding]="noPadding">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styleUrl: './info-card.component.scss'
})
export class FwInfoCardComponent {
  @Input() icon?: any;
  /** Requis sauf si un en-tête personnalisé est projeté via [header-left], ou si [noHeader] est actif. */
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() accent: 'default' | 'primary' = 'default';
  @Input() noPadding: boolean = false;
  /** Supprime entièrement l'en-tête (carte "coquille" sans icône/titre, ex. tuile de stat). */
  @Input() noHeader: boolean = false;
}
