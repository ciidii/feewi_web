import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Utensils, Bus, BookOpen, Heart, Star } from 'lucide-angular';
import { ServiceConfig, ServiceSubscriptionRequest } from '../../../../../../core/models/enrollment';

interface ServiceSelection {
  svc: ServiceConfig;
  selected: boolean;
  selectedOption: string;
}

@Component({
  selector: 'app-step-services',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="step-content animate-fade">
      <div class="content-header">
        <h1>Services Additionnels</h1>
        <p>Sélectionnez les prestations souhaitées pour l'élève.</p>
      </div>

      <div class="services-stack">
        <div *ngFor="let item of selections" class="service-card-premium"
             [class.active]="item.selected"
             [class.mandatory]="item.svc.mandatory"
             (click)="!item.svc.mandatory && toggleService(item)">

          <div class="icon-box">
            <lucide-icon [name]="getIcon(item.svc.code)" [size]="24"></lucide-icon>
          </div>

          <div class="info">
            <span class="title">{{ item.svc.label }}</span>
            <span class="mandatory-badge" *ngIf="item.svc.mandatory">Obligatoire</span>

            <!-- Sélecteur d'option (si le service a des options et est sélectionné) -->
            <div class="options-row" *ngIf="item.selected && item.svc.options.length > 0" (click)="$event.stopPropagation()">
              <label class="option-label">Choisir une option :</label>
              <div class="option-chips">
                <button *ngFor="let opt of item.svc.options" class="opt-chip"
                        [class.active]="item.selectedOption === opt"
                        (click)="selectOption(item, opt); $event.stopPropagation()">
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>

          <div class="check-box" [class.checked]="item.selected"></div>
        </div>

        <div *ngIf="!availableServices?.length" class="empty-services">
          <p>Aucun service disponible pour ce niveau.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .services-stack { display: flex; flex-direction: column; gap: 1rem; }
    .service-card-premium {
      display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem;
      background: white; border: 1px solid #e2e8f0; border-radius: 16px;
      cursor: pointer; transition: all 0.2s;
      &.active { border-color: #2563eb; background: #eff6ff; }
      &.mandatory { cursor: default; }
    }
    .icon-box { width: 48px; height: 48px; border-radius: 12px; background: #f8fafc; color: #2563eb; display: grid; place-items: center; }
    .info { flex: 1; .title { font-weight: 700; color: #0f172a; } }
    .mandatory-badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; margin-left: 0.5rem; }
    .options-row { margin-top: 1rem; .option-label { font-size: 0.8rem; font-weight: 600; color: #64748b; display: block; margin-bottom: 0.5rem; } }
    .option-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .opt-chip { padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 0.8rem; font-weight: 600; cursor: pointer; &.active { background: #2563eb; color: white; border-color: #2563eb; } }
    .check-box { width: 24px; height: 24px; border-radius: 6px; border: 2px solid #e2e8f0; background: white; position: relative; &.checked { background: #2563eb; border-color: #2563eb; &::after { content: '✓'; color: white; position: absolute; inset: 0; display: grid; place-items: center; font-size: 0.8rem; font-weight: 900; } } }
    .empty-services { padding: 3rem; text-align: center; color: #64748b; background: #f8fafc; border-radius: 16px; border: 2px dashed #e2e8f0; }
  `]
})
export class StepServicesComponent implements OnChanges {
  @Input() availableServices: ServiceConfig[] = [];
  @Output() selectionsChange = new EventEmitter<ServiceSubscriptionRequest[]>();

  selections: ServiceSelection[] = [];

  ngOnChanges() {
    this.selections = (this.availableServices ?? []).map(svc => {
      // Garder les sélections existantes si possible (pour ne pas perdre les choix lors d'un toggle d'étape)
      const existing = this.selections.find(s => s.svc.code === svc.code);
      return {
        svc,
        selected: existing ? existing.selected : svc.mandatory,
        selectedOption: existing ? existing.selectedOption : (svc.mandatory && svc.options.length > 0 ? svc.options[0] : '')
      };
    });
    this.emit();
  }

  toggleService(item: ServiceSelection) {
    item.selected = !item.selected;
    if (!item.selected) item.selectedOption = '';
    this.emit();
  }

  selectOption(item: ServiceSelection, opt: string) {
    item.selectedOption = opt;
    this.emit();
  }

  private emit() {
    const result: ServiceSubscriptionRequest[] = this.selections
      .filter(item => item.selected)
      .map(item => ({
        serviceCode: item.svc.code,
        optionCode: item.selectedOption
      }));
    this.selectionsChange.emit(result);
  }

  isValid(): boolean {
    return this.selections
      .filter(item => item.selected && item.svc.options.length > 0)
      .every(item => !!item.selectedOption);
  }

  getIcon(code: string) {
    const icons: Record<string, any> = {
      'CANTEEN': Utensils,
      'TRANSPORT': Bus,
      'AFTER_SCHOOL_CARE': BookOpen,
      'HEALTH': Heart,
    };
    return icons[code] ?? Star;
  }

  readonly Utensils = Utensils;
  readonly Bus = Bus;
  readonly BookOpen = BookOpen;
  readonly Heart = Heart;
  readonly Star = Star;
}
