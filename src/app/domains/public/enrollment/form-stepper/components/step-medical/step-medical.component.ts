import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {PillarConfig} from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-medical',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Santé</h1>
        <p>Données médicales confidentielles.</p>
      </div>

      <div class="premium-form-grid">
        <div class="form-group">
          <label>Groupe Sanguin</label>
          <select [(ngModel)]="medical.bloodGroup" class="premium-select">
            <option value="">Inconnu</option>
            <option value="O+">O+</option><option value="O-">O-</option>
            <option value="A+">A+</option><option value="A-">A-</option>
            <option value="B+">B+</option><option value="B-">B-</option>
            <option value="AB+">AB+</option><option value="AB-">AB-</option>
          </select>
        </div>
        <div class="form-group full">
          <label>Allergies connues</label>
          <textarea [(ngModel)]="medical.criticalAllergies" class="premium-textarea" rows="3"></textarea>
        </div>

        <!-- CHAMPS DYNAMIQUES CMS MEDICAL -->
        <ng-container *ngIf="config">
          <div *ngFor="let field of config.customFields" class="form-group">
            <label>{{ field.label }}</label>
            <input type="text" [(ngModel)]="medical[field.name]" class="premium-input">
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class StepMedicalComponent {
  @Input() medical: any;
  @Input() config?: PillarConfig;
}
