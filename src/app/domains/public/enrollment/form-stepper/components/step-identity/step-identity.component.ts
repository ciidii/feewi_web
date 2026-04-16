import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {PillarConfig} from '../../../../../../core/models/enrollment';

@Component({
  selector: 'app-step-identity',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>L'Élève</h1>
        <p>Informations d'état civil et vœu de scolarité.</p>
      </div>

      <div class="premium-form-grid">
        <div class="form-group full">
          <label>Niveau scolaire demandé</label>
          <select [(ngModel)]="schooling.levelId" (change)="onLevelChange.emit(schooling.levelId)" class="premium-select highlight">
            <option value="">Sélectionnez un niveau...</option>
            <option *ngFor="let level of availableLevels" [value]="level.id">{{ level.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Prénoms</label>
          <input type="text" [(ngModel)]="identity.firstName" class="premium-input">
        </div>
        <div class="form-group">
          <label>Nom de famille</label>
          <input type="text" [(ngModel)]="identity.lastName" class="premium-input">
        </div>
        <div class="form-group">
          <label>Sexe</label>
          <select [(ngModel)]="identity.gender" class="premium-select">
            <option value="MALE">Masculin</option>
            <option value="FEMALE">Féminin</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date de naissance</label>
          <input type="date" [(ngModel)]="identity.birthDate" class="premium-input">
        </div>

        <!-- CHAMPS DYNAMIQUES CMS IDENTITY -->
        <ng-container *ngIf="config">
          <div *ngFor="let field of config.customFields" class="form-group">
            <label>{{ field.label }}</label>
            <input type="text" [(ngModel)]="identity[field.name]" class="premium-input">
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class StepIdentityComponent {
  @Input() identity: any;
  @Input() schooling: any;
  @Input() config?: PillarConfig;
  @Input() availableLevels: any[] = [];
  @Output() onLevelChange = new EventEmitter<string>();
}
