import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {BarChart3, Filter, LucideAngularModule, Search, X} from 'lucide-angular';
import {FwModalShellComponent} from '../modal-shell/modal-shell.component';
import {FwButtonComponent} from '../button/button.component';
import {FormsModule} from '@angular/forms';

export interface ReportItem {
  id: string | number;
  title: string;
  subtitle?: string;
  value: string | number;
  subValue?: string;
  progress?: number; // 0 to 100
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface ReportModalData {
  title: string;
  subtitle?: string;
  icon?: any;
  items: ReportItem[];
  searchPlaceholder?: string;
}

@Component({
  selector: 'app-fw-report-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    LucideAngularModule,
    FwModalShellComponent,
    FwButtonComponent,
    FormsModule
  ],
  templateUrl: './report-modal.html',
  styleUrls: ['./report-modal.scss']
})
export class FwReportModalComponent {
  private dialogRef = inject(MatDialogRef<FwReportModalComponent>);
  data: ReportModalData = inject(MAT_DIALOG_DATA);

  // --- ÉTAT ---
  searchQuery = signal('');

  // --- LOGIQUE DE FILTRE ---
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.data.items;

    return this.data.items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query))
    );
  });

  // --- ICONS ---
  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly BarChartIcon = BarChart3;
  readonly FilterIcon = Filter;

  onClose() {
    this.dialogRef.close();
  }
}
