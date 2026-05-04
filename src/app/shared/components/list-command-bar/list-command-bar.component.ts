import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule, Search, X} from 'lucide-angular';
import {FormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';

export interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-fw-list-command-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, MatCheckboxModule],
  templateUrl: './list-command-bar.component.html',
  styleUrls: ['./list-command-bar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FwListCommandBarComponent {
  // --- RECHERCHE ---
  @Input() searchQuery: string = '';
  @Input() searchPlaceholder: string = 'Rechercher...';
  @Output() searchChange = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();

  // --- SÉLECTION ---
  @Input() selectedCount: number = 0;
  @Input() isAllSelected: boolean = false;
  @Input() isPartiallySelected: boolean = false;
  @Output() toggleAll = new EventEmitter<void>();

  // --- FILTRES ACTIFS & COMPTEUR ---
  @Input() totalElements: number = 0;
  @Input() activeFilters: ActiveFilterChip[] = [];
  @Output() removeFilter = new EventEmitter<string>();
  @Output() clearAllFilters = new EventEmitter<void>();

  // --- PAGINATION / DENSITÉ ---
  @Input() pageSize: number = 20;
  @Input() pageSizeOptions: number[] = [20, 50, 100];
  @Output() pageSizeChange = new EventEmitter<number>();

  // Icons
  readonly SearchIcon = Search;
  readonly XIcon = X;

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }
}
