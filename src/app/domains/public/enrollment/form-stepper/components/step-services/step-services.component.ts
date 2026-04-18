import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookOpen, Bus, Heart, LucideAngularModule, Star, Utensils } from 'lucide-angular';
import { ServiceConfig, ServiceSubscriptionRequest } from '../../../../../../core/models/enrollment';

interface ServiceSelection {
  svc: ServiceConfig;
  selected: boolean;
  selectedOption: string;
}

@Component({
  selector: 'app-step-services',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div>
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Services additionnels</h1>
        <p class="text-slate-500 mt-2">Sélectionnez les prestations souhaitées pour l'élève.</p>
      </div>

      <div class="flex flex-col gap-3">
        <div *ngFor="let item of selections"
             class="flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200"
             [class.border-blue-500]="item.selected"
             [class.bg-blue-50]="item.selected"
             [class.border-slate-100]="!item.selected"
             [class.bg-white]="!item.selected"
             [class.hover:border-slate-300]="!item.svc.mandatory"
             [class.cursor-default]="item.svc.mandatory"
             (click)="!item.svc.mandatory && toggle(item)">

          <!-- Icône -->
          <div class="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-blue-600">
            <lucide-icon [name]="getIcon(item.svc.code)" [size]="20"></lucide-icon>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-slate-800">{{ item.svc.label }}</span>
              <span *ngIf="item.svc.mandatory"
                    class="text-[10px] font-extrabold uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                Obligatoire
              </span>
            </div>

            <!-- Options -->
            <div *ngIf="item.selected && item.svc.options.length > 0"
                 class="mt-3"
                 (click)="$event.stopPropagation()">
              <p class="text-xs font-bold text-slate-400 mb-2">Choisir une option</p>
              <div class="flex flex-wrap gap-2">
                <button *ngFor="let opt of item.svc.options"
                        type="button"
                        class="px-3 py-1.5 rounded-xl border text-xs font-bold transition"
                        [class.bg-blue-600]="item.selectedOption === opt"
                        [class.text-white]="item.selectedOption === opt"
                        [class.border-blue-600]="item.selectedOption === opt"
                        [class.bg-white]="item.selectedOption !== opt"
                        [class.text-slate-600]="item.selectedOption !== opt"
                        [class.border-slate-200]="item.selectedOption !== opt"
                        (click)="selectOption(item, opt); $event.stopPropagation()">
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>

          <!-- Checkbox -->
          <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
               [class.bg-blue-600]="item.selected"
               [class.border-blue-600]="item.selected"
               [class.border-slate-200]="!item.selected">
            <span *ngIf="item.selected" class="text-white text-xs font-black">✓</span>
          </div>
        </div>

        <!-- Vide -->
        <div *ngIf="!selections.length"
             class="p-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p class="text-sm font-semibold text-slate-400">Aucun service disponible pour ce niveau.</p>
        </div>
      </div>
    </div>
  `
})
export class StepServicesComponent implements OnChanges {
  @Input() availableServices: ServiceConfig[] = [];
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
}
