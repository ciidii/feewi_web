import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChefHat, Bus } from 'lucide-angular';

@Component({
  selector: 'app-step-services',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Services Additionnels</h1>
        <p>Sélectionnez les prestations souhaitées pour l'élève.</p>
      </div>

      <div class="services-stack space-y-6">
        <div *ngIf="hasService('CANTEEN')" class="service-card-premium" [class.active]="services.canteen" (click)="services.canteen = !services.canteen">
          <div class="icon-box"><lucide-icon [name]="ChefHat"></lucide-icon></div>
          <div class="info">
            <span class="title">Restauration Scolaire</span>
            <p>Accès à la cantine le midi.</p>
          </div>
          <div class="check-box" [class.checked]="services.canteen"></div>
        </div>

        <div *ngIf="hasService('TRANSPORT')" class="service-card-premium" [class.active]="services.transport" (click)="services.transport = !services.transport">
          <div class="icon-box"><lucide-icon [name]="Bus"></lucide-icon></div>
          <div class="info">
            <span class="title">Transport Scolaire</span>
            <p>Ramassage par les bus de l'école.</p>
          </div>
          <div class="check-box" [class.checked]="services.transport"></div>
        </div>
      </div>
    </div>
  `
})
export class StepServicesComponent {
  @Input() services: any;
  @Input() enabledServices: string[] = [];

  hasService(code: string): boolean {
    return this.enabledServices.includes(code);
  }

  readonly ChefHat = ChefHat;
  readonly Bus = Bus;
}
