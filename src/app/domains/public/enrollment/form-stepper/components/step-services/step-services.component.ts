import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookOpen, Bus, Heart, LucideAngularModule, Star, Utensils, LayoutGrid, Check } from 'lucide-angular';
import { ServiceConfig, ServiceSubscriptionRequest } from '../../../../../../core/models/enrollment';
import { FwBadgeComponent } from '../../../../../../shared/components/badge/badge.component';
import { FwButtonComponent } from '../../../../../../shared/components/button/button.component';

interface ServiceSelection {
  svc: ServiceConfig;
  selected: boolean;
  selectedOption: string;
}

@Component({
  selector: 'app-step-services',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwBadgeComponent, FwButtonComponent],
  template: `
    <div class="animate-fade">
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="LayoutGrid" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">{{ title || 'Services & Extras' }}</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          {{ subtitle || 'Sélectionnez les prestations additionnelles souhaitées pour l\\'accompagnement de votre enfant.' }}
        </p>
      </div>

      <div class="space-y-4">
        <div *ngFor="let item of selections"
             class="group flex flex-col p-6 md:p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-300 bg-white shadow-sm hover:shadow-md"
             [ngClass]="{ 'bg-primary-alpha/5': item.selected }"
             [class.border-primary]="item.selected"
             [class.border-border]="!item.selected"
             [class.cursor-default]="item.svc.mandatory"
             (click)="!item.svc.mandatory && toggle(item)">

          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <!-- Icône -->
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
                 [class.bg-midnight]="item.selected"
                 [class.text-white]="item.selected"
                 [class.bg-surface-sunken]="!item.selected"
                 [class.text-midnight]="!item.selected">
              <lucide-icon [name]="getIcon(item.svc.code)" [size]="28"></lucide-icon>
            </div>

            <!-- Info -->
            <div class="flex-1 text-center sm:text-left min-w-0">
              <div class="flex flex-col sm:flex-row items-center gap-3 mb-2">
                <span class="font-black text-midnight text-xl tracking-tight leading-tight">{{ item.svc.label }}</span>
                <app-fw-badge *ngIf="item.svc.mandatory" status="SUBMITTED" labelOverride="Inclus" size="xs"></app-fw-badge>
              </div>
              <p class="text-sm text-text-secondary font-medium leading-relaxed">Service d'accompagnement géré par l'établissement</p>
            </div>

            <!-- Checkbox Custom -->
            <div class="hidden sm:flex w-10 h-10 rounded-xl border-2 items-center justify-center shrink-0 transition-all duration-300"
                 [class.bg-primary]="item.selected"
                 [class.border-primary]="item.selected"
                 [class.border-border]="!item.selected"
                 [class.bg-white]="!item.selected">
              <lucide-icon *ngIf="item.selected" [name]="Check" [size]="20" class="text-white"></lucide-icon>
            </div>
            
            <!-- Mobile Toggle -->
            <div class="sm:hidden w-full">
               <app-fw-button [variant]="item.selected ? 'primary' : 'secondary'" class="w-full">
                 {{ item.selected ? 'Sélectionné' : 'Choisir' }}
               </app-fw-button>
            </div>
          </div>

          <!-- Options Expansion -->
          <div *ngIf="item.selected && item.svc.options.length > 0"
               class="mt-8 pt-8 border-t border-border/50 animate-fade"
               (click)="$event.stopPropagation()">
            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-4 block">Variante ou Option</label>
            <div class="flex flex-wrap gap-3">
              <button *ngFor="let opt of item.svc.options"
                      type="button"
                      class="px-6 py-3 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all"
                      [class.bg-midnight]="item.selectedOption === opt"
                      [class.text-white]="item.selectedOption === opt"
                      [class.border-midnight]="item.selectedOption === opt"
                      [class.bg-white]="item.selectedOption !== opt"
                      [class.text-text-tertiary]="item.selectedOption !== opt"
                      [class.border-border]="item.selectedOption !== opt"
                      [class.hover:border-midnight]="item.selectedOption !== opt"
                      (click)="selectOption(item, opt); $event.stopPropagation()">
                {{ opt }}
              </button>
            </div>
          </div>
        </div>

        <!-- État vide -->
        <div *ngIf="!selections.length"
             class="p-12 text-center bg-surface-sunken rounded-3xl border-2 border-dashed border-border">
          <lucide-icon [name]="Star" [size]="32" class="mx-auto text-text-tertiary mb-4 opacity-50"></lucide-icon>
          <p class="text-sm font-bold text-text-secondary">Aucun service additionnel n'est proposé pour ce niveau scolaire.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StepServicesComponent implements OnChanges {
  @Input() availableServices: ServiceConfig[] = [];
  @Input() title?: string;
  @Input() subtitle?: string;
  @Output() selectionsChange = new EventEmitter<ServiceSubscriptionRequest[]>();

  selections: ServiceSelection[] = [];

  ngOnChanges() {
    this.selections = (this.availableServices ?? []).map(svc => {
      const existing = this.selections.find(s => s.svc.code === svc.code);
      return {
        svc,
        selected: existing ? existing.selected : svc.mandatory,
        selectedOption: existing ? existing.selectedOption : (svc.mandatory && svc.options.length > 0 ? svc.options[0] : '')
      };
    });
    this.emit();
  }

  toggle(item: ServiceSelection) {
    item.selected = !item.selected;
    if (!item.selected) item.selectedOption = '';
    this.emit();
  }

  selectOption(item: ServiceSelection, opt: string) {
    item.selectedOption = opt;
    this.emit();
  }

  private emit() {
    this.selectionsChange.emit(
      this.selections
        .filter(i => i.selected)
        .map(i => ({ serviceCode: i.svc.code, optionCode: i.selectedOption }))
    );
  }

  getIcon(code: string): any {
    return ({ CANTEEN: Utensils, TRANSPORT: Bus, AFTER_SCHOOL_CARE: BookOpen, HEALTH: Heart } as Record<string, any>)[code] ?? Star;
  }

  readonly LayoutGrid = LayoutGrid;
  readonly Star = Star;
  readonly Check = Check;
}
