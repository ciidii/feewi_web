import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, CheckCircle, Archive, Trash2, Download } from 'lucide-angular';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatCheckboxModule],
  template: `
    <div class="flex items-center gap-6 animate-in slide-in-from-left duration-200 h-full">
      <!-- État de la sélection -->
      <div class="flex items-center gap-4">
        <mat-checkbox 
          color="primary" 
          [checked]="isAllSelected()" 
          [indeterminate]="isPartiallySelected()"
          (change)="onToggleAll.emit()"
          class="scale-90"
        ></mat-checkbox>
        
        <div class="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm">
          <span class="text-xs font-bold text-primary tracking-tight">{{ selectedCount() }} sélectionné(s)</span>
          <button (click)="onClear.emit()" class="p-0.5 hover:bg-primary/20 rounded-full transition-colors text-primary">
            <lucide-icon [name]="X" class="w-3 h-3"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="h-6 w-[1px] bg-border-subtle"></div>

      <!-- Barre d'actions -->
      <div class="flex items-center gap-1">
        <button 
          (click)="onBulkValidate.emit([])" 
          class="bulk-btn hover:bg-green-50 hover:text-green-600" 
          title="Valider la sélection"
        >
          <lucide-icon [name]="CheckCircle" class="w-5 h-5"></lucide-icon>
        </button>
        <button class="bulk-btn hover:bg-blue-50 hover:text-blue-600" title="Archiver">
          <lucide-icon [name]="Archive" class="w-5 h-5"></lucide-icon>
        </button>
        <button class="bulk-btn hover:bg-red-50 hover:text-red-600" title="Supprimer">
          <lucide-icon [name]="Trash2" class="w-5 h-5"></lucide-icon>
        </button>
        <button class="bulk-btn hover:bg-slate-100 text-slate-medium hover:text-midnight" title="Exporter">
          <lucide-icon [name]="Download" class="w-5 h-5"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bulk-btn {
      @apply w-10 h-10 flex items-center justify-center rounded-xl text-slate-medium transition-all active:scale-90;
    }
  `]
})
export class BulkActions {
  selectedCount = input.required<number>();
  isAllSelected = input.required<boolean>();
  isPartiallySelected = input.required<boolean>();

  onClear = output<void>();
  onToggleAll = output<void>();
  onBulkValidate = output<any[]>();

  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly Archive = Archive;
  readonly Trash2 = Trash2;
  readonly Download = Download;
}
