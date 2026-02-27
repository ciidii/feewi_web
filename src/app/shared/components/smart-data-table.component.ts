import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, MoreHorizontal, Eye, CheckCircle, Printer, Search, X, SlidersHorizontal, Trash2, Download, Archive } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

export interface TabItem {
  label: string;
  icon?: any;
  count?: number;
}

export interface TableRow {
  id: string | number;
  title: string;
  subtitle?: string;
  avatarLabel?: string;
  avatarUrl?: string;
  date?: string;
  badges?: { label: string; class: string }[];
  rawData?: any;
}

@Component({
  selector: 'app-smart-data-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatButtonModule, MatCheckboxModule, FormsModule],
  template: `
    <div class="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      
      <!-- Toolbar Dynamique (Tabs OU Actions Groupées) -->
      <div class="flex items-center justify-between border-b border-border-subtle bg-slate-50/20 px-6 h-16 transition-all">
        
        <!-- Cas : Actions Groupées (Affiché si au moins une ligne est sélectionnée) -->
        <div *ngIf="selectedIds().size > 0" class="flex items-center gap-6 animate-in slide-in-from-left duration-200">
          <div class="flex items-center gap-4">
            <mat-checkbox 
              color="primary" 
              [checked]="isAllSelected()" 
              [indeterminate]="isPartiallySelected()"
              (change)="toggleAll()"
            ></mat-checkbox>
            <span class="text-sm font-bold text-primary">{{ selectedIds().size }} sélectionné(s)</span>
          </div>

          <div class="h-6 w-[1px] bg-border-subtle"></div>

          <div class="flex items-center gap-1">
            <button (click)="onBulkValidate.emit(Array.from(selectedIds()))" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-green-50 text-slate-medium hover:text-green-600 transition-all" title="Valider la sélection">
              <lucide-icon [name]="CheckCircle" class="w-5 h-5"></lucide-icon>
            </button>
            <button class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-blue-50 text-slate-medium hover:text-blue-600 transition-all" title="Archiver">
              <lucide-icon [name]="Archive" class="w-5 h-5"></lucide-icon>
            </button>
            <button class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-medium hover:text-red-600 transition-all" title="Supprimer">
              <lucide-icon [name]="Trash2" class="w-5 h-5"></lucide-icon>
            </button>
            <button class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-medium hover:text-midnight transition-all" title="Exporter">
              <lucide-icon [name]="Download" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Cas : Onglets Classiques (Affiché si rien n'est sélectionné) -->
        <div *ngIf="selectedIds().size === 0" class="flex h-full gap-1 animate-in fade-in duration-300">
          <div class="flex items-center mr-4">
             <mat-checkbox color="primary" (change)="toggleAll()"></mat-checkbox>
          </div>
          <button 
            *ngFor="let tab of tabs()" 
            (click)="onTabChange.emit(tab.label)"
            class="px-5 transition-all relative h-full flex items-center gap-3 border-b-2 border-transparent hover:bg-slate-100/50 group"
            [class.text-primary]="activeTab() === tab.label"
            [class.border-primary]="activeTab() === tab.label"
            [class.text-slate-medium]="activeTab() !== tab.label"
          >
            <lucide-icon *ngIf="tab.icon" [name]="tab.icon" class="w-4.5 h-4.5 group-hover:scale-110 transition-transform" [class.text-primary]="activeTab() === tab.label"></lucide-icon>
            <span class="text-sm font-bold tracking-tight">{{ tab.label }}</span>
            <span *ngIf="tab.count" class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold" [class.bg-primary/10]="activeTab() === tab.label" [class.text-primary]="activeTab() === tab.label">
              {{ tab.count }}
            </span>
          </button>
        </div>
        
        <!-- Recherche (Toujours visible ou masquée selon besoin) -->
        <div class="relative flex items-center group ml-4" *ngIf="showSearch() && selectedIds().size === 0">
          <div class="absolute left-3.5 z-10 pointer-events-none">
            <lucide-icon [name]="Search" class="w-4 h-4 text-slate-medium group-focus-within:text-primary transition-colors"></lucide-icon>
          </div>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch.emit($event)"
            placeholder="Filtrer..." 
            class="w-48 focus:w-64 bg-ice/50 border border-border-subtle rounded-xl py-2 pl-10 pr-10 text-xs outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all font-bold placeholder:text-slate-400"
          />
          <button *ngIf="searchQuery()" (click)="clearSearch()" class="absolute right-10 p-1 hover:bg-slate-100 rounded-full transition-colors">
            <lucide-icon [name]="X" class="w-3 h-3 text-slate-medium"></lucide-icon>
          </button>
          <button class="absolute right-3 p-1 text-slate-medium hover:text-primary transition-colors">
            <lucide-icon [name]="SlidersHorizontal" class="w-3.5 h-3.5"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Table Body -->
      <div class="flex flex-col">
        <div 
          *ngFor="let row of data()" 
          class="group flex items-center px-6 py-4 border-b border-border-subtle last:border-b-0 transition-all cursor-pointer relative"
          [class.bg-blue-50/30]="selectedIds().has(row.id)"
          [class.hover:bg-ice/40]="!selectedIds().has(row.id)"
          (click)="toggleRow(row.id)"
        >
          <!-- Leading (Selection & Avatar) -->
          <div class="flex items-center gap-6 w-28 shrink-0" (click)="$event.stopPropagation()">
            <mat-checkbox 
              color="primary" 
              [checked]="selectedIds().has(row.id)"
              (change)="toggleRow(row.id)"
              class="transition-opacity scale-90"
              [class.opacity-0]="!selectedIds().has(row.id)"
              [class.group-hover:opacity-100]="true"
            ></mat-checkbox>
            <div class="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center border border-border-subtle shrink-0 shadow-inner overflow-hidden">
              <img *ngIf="row.avatarUrl" [src]="row.avatarUrl" class="w-full h-full object-cover" />
              <span *ngIf="!row.avatarUrl" class="text-xs font-bold text-slate-medium uppercase">{{ row.avatarLabel || row.title.charAt(0) }}</span>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pr-4">
            <div class="flex items-baseline gap-3">
              <span class="text-[15px] font-bold text-midnight tracking-tight">{{ row.title }}</span>
              <span class="text-xs text-slate-medium truncate font-medium opacity-80">{{ row.subtitle }}</span>
            </div>
            <div class="flex gap-2 mt-2">
              <span *ngFor="let badge of row.badges" class="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-sm" [ngClass]="getBadgeClass(badge.class)">
                {{ badge.label }}
              </span>
            </div>
          </div>

          <!-- Meta -->
          <div class="text-right w-32 shrink-0 group-hover:opacity-0 transition-opacity">
            <span class="text-xs font-bold text-slate-medium/70 uppercase tracking-tighter">{{ row.date }}</span>
          </div>

          <!-- Hover Actions (Single Row) -->
          <div class="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-border-subtle shadow-xl translate-x-4 group-hover:translate-x-0" (click)="$event.stopPropagation()">
            <button (click)="onView.emit(row)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-ice text-slate-medium hover:text-primary transition-all active:scale-90" title="Voir">
              <lucide-icon [name]="Eye" class="w-4.5 h-4.5"></lucide-icon>
            </button>
            <button (click)="onValidate.emit(row)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-green-50 text-slate-medium hover:text-green-600 transition-all active:scale-90" title="Valider">
              <lucide-icon [name]="CheckCircle" class="w-4.5 h-4.5"></lucide-icon>
            </button>
            <button (click)="onPrint.emit(row)" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-ice text-slate-medium hover:text-midnight transition-all active:scale-90" title="Imprimer">
              <lucide-icon [name]="Printer" class="w-4.5 h-4.5"></lucide-icon>
            </button>
            <button class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-ice text-slate-medium transition-all active:scale-90">
              <lucide-icon [name]="MoreHorizontal" class="w-4.5 h-4.5"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="data().length === 0" class="p-20 text-center flex flex-col items-center gap-4 bg-slate-50/20">
          <div class="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-border-subtle mb-2">
            <lucide-icon [name]="Search" class="w-8 h-8 text-slate-200"></lucide-icon>
          </div>
          <span class="text-sm font-bold text-slate-medium uppercase tracking-widest">Aucun dossier trouvé</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-8 py-5 border-t border-border-subtle flex items-center justify-between bg-slate-50/40 mt-auto">
        <span class="text-[11px] text-slate-medium font-bold uppercase tracking-widest">
          Affichage : <strong>{{ data().length }}</strong> sur <strong>{{ total() }}</strong> éléments
        </span>
        <div class="flex items-center gap-3">
           <button class="h-9 px-5 rounded-xl border border-border-subtle bg-white text-xs font-bold text-slate-medium hover:text-midnight hover:border-slate-400 hover:shadow-sm disabled:opacity-30 transition-all" disabled>Précédent</button>
           <button class="h-9 px-5 rounded-xl border border-border-subtle bg-white text-xs font-bold text-slate-medium hover:text-midnight hover:border-slate-400 hover:shadow-sm transition-all">Suivant</button>
        </div>
      </div>
    </div>
  `,
})
export class SmartDataTableComponent {
  data = input<TableRow[]>([]);
  tabs = input<TabItem[]>([]);
  activeTab = input<string>('Tous');
  total = input<number>(0);
  showSearch = input<boolean>(true);

  onTabChange = output<string>();
  onSearch = output<string>();
  onView = output<TableRow>();
  onValidate = output<TableRow>();
  onPrint = output<TableRow>();
  onBulkValidate = output<(string | number)[]>();

  searchQuery = signal('');
  selectedIds = signal<Set<string | number>>(new Set());

  // Computed states for selection
  isAllSelected = computed(() => this.data().length > 0 && this.selectedIds().size === this.data().length);
  isPartiallySelected = computed(() => this.selectedIds().size > 0 && this.selectedIds().size < this.data().length);

  readonly Eye = Eye;
  readonly CheckCircle = CheckCircle;
  readonly Printer = Printer;
  readonly MoreHorizontal = MoreHorizontal;
  readonly Search = Search;
  readonly X = X;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Trash2 = Trash2;
  readonly Download = Download;
  readonly Archive = Archive;

  toggleRow(id: string | number) {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  toggleAll() {
    if (this.isAllSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.data().map(r => r.id)));
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.onSearch.emit('');
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-50 text-green-700 border-green-100 shadow-green-100/50';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50';
      case 'danger': return 'bg-red-50 text-red-700 border-red-100 shadow-red-100/50';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-100 shadow-blue-100/50';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 shadow-slate-100/50';
    }
  }

  protected readonly Array = Array;
}
