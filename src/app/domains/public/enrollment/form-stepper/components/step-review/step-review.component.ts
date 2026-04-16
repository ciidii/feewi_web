import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Validation Finale</h1>
        <p>Veuillez contrôler les informations avant l'envoi au secrétariat.</p>
      </div>

      <div class="review-grid-v6">
        <div class="review-card-premium">
          <span class="card-tag">Responsable Légal</span>
          <div class="row">
            <span class="label">Identité</span>
            <span class="value">{{ family.firstName }} {{ family.lastName }}</span>
          </div>
          <div class="row">
            <span class="label">Lien / Parenté</span>
            <span class="value">{{ family.relation }}</span>
          </div>
          <div class="row">
            <span class="label">Contact</span>
            <span class="value">{{ family.phone }}</span>
          </div>
        </div>

        <div class="review-card-premium" *ngIf="identity">
          <span class="card-tag">Le Candidat</span>
          <div class="row">
            <span class="label">Élève</span>
            <span class="value">{{ identity.firstName }} {{ identity.lastName }}</span>
          </div>
          <div class="row">
            <span class="label">Niveau visé</span>
            <span class="value">{{ schooling.levelId }}</span>
          </div>
        </div>
      </div>

      <div class="legal-consent">
        <label class="premium-checkbox">
          <input type="checkbox" [(ngModel)]="consent.checked">
          <div class="checkmark"></div>
          <span>Je certifie l'exactitude des informations fournies dans ce dossier.</span>
        </label>
      </div>
    </div>
  `
})
export class StepReviewComponent {
  @Input() family: any;
  @Input() identity: any;
  @Input() schooling: any;
  @Input() consent: { checked: boolean } = { checked: false };
}
