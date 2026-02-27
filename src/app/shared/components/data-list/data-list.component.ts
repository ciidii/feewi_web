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
  selector: 'app-data-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatButtonModule, MatCheckboxModule, FormsModule],
  templateUrl: './data-list.component.html',
  styleUrl: './data-list.component.scss'
})
export class DataListComponent {
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

  getSelectedIdsArray(): (string | number)[] {
    return Array.from(this.selectedIds());
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
}
