import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {LucideAngularModule} from 'lucide-angular';
import {PillarConfig} from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-family',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Identité du Responsable</h1>
        <p>Commençons par identifier le tuteur légal de l'enfant.</p>
      </div>

      <div class="premium-form-grid">
        <div class="form-group">
          <label>Votre lien de parenté</label>
          <select [(ngModel)]="data.relation" class="premium-select">
            <option value="FATHER">Père</option>
            <option value="MOTHER">Mère</option>
            <option value="GUARDIAN">Tuteur Légal</option>
          </select>
        </div>
        <div class="form-group">
          <label>Email de contact</label>
          <input type="email" [(ngModel)]="data.email" class="premium-input" placeholder="nom@exemple.com">
        </div>
        <div class="form-group">
          <label>Nom</label>
          <input type="text" [(ngModel)]="data.lastName" class="premium-input">
        </div>
        <div class="form-group">
          <label>Prénom</label>
          <input type="text" [(ngModel)]="data.firstName" class="premium-input">
        </div>
        <div class="form-group">
          <label>Téléphone Mobile</label>
          <input type="tel" [(ngModel)]="data.phone" class="premium-input">
        </div>
        <div class="form-group">
          <label>Adresse de résidence</label>
          <input type="text" [(ngModel)]="data.homeAddress" class="premium-input">
        </div>

        <!-- CHAMPS DYNAMIQUES CMS -->
        <ng-container *ngIf="config">
          <div *ngFor="let field of config.customFields" class="form-group" [class.full]="field.type === 'TEXT'">
            <label>{{ field.label }} <span *ngIf="field.mandatory" class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="data[field.name]" class="premium-input">
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class StepFamilyComponent {
  @Input() data: any;
  @Input() config?: PillarConfig;
}
