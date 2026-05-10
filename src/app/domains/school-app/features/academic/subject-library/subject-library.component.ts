import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BookOpen, Edit, Info, LucideAngularModule, Plus, Search, Tag, Trash2,RefreshCw} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {Subject} from '../../../../../core/models/academic.model';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {SubjectFormComponent} from '../structure-config/components/subject-form/subject-form.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';

@Component({
  selector: 'app-subject-library',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataListComponent,
    MatDialogModule,
    FwPageShellComponent,
    FwEmptyStateComponent,
    FwListCommandBarComponent,
    FwButtonComponent
  ],
  templateUrl: './subject-library.component.html',
  styleUrls: ['./subject-library.component.scss']
})
export class SubjectLibraryComponent implements OnInit {
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Icônes
  readonly BookOpen = BookOpen;
  readonly Plus = Plus;
  readonly Tag = Tag;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Search = Search;
  readonly Info = Info;
  readonly RefreshCw = RefreshCw;

  // États
  subjects = signal<Subject[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) {
      chips.push({key: 'q', label: 'Recherche', value: this.searchQuery()});
    }
    return chips;
  });

  // Actions pour les matières
  readonly subjectActions: RowAction[] = [
    {id: 'edit', label: 'Modifier', icon: Edit, type: 'primary'},
    {id: 'delete', label: 'Supprimer', icon: Trash2, type: 'danger'}
  ];

  // Transformation des matières pour le DataList avec filtrage
  displaySubjects = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    return this.subjects()
      .filter(s => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query))
      .map(s => ({
        id: s.id,
        title: s.name,
        subtitle: `Code technique : ${s.code}`,
        avatarLabel: s.code.substring(0, 2).toUpperCase(),
        badges: [
          {
            label: s.isProvisioned ? 'NATIONAL' : 'ÉTABLISSEMENT',
            type: s.isProvisioned ? 'success' : 'info'
          }
        ],
        rawData: s
      }));
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.academicService.getSubjects());
      this.subjects.set(data);
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement de la bibliothèque.");
    } finally {
      this.isLoading.set(false);
    }
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'edit') {
      this.openSubjectForm(event.row.rawData);
    } else if (event.actionId === 'delete') {
      this.confirmDelete(event.row.rawData);
    }
  }

  openSubjectForm(subject?: Subject) {
    const dialogRef = this.dialog.open(SubjectFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel',
      data: {subject}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  private async confirmDelete(subject: Subject) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer de la bibliothèque ?',
        message: `Vous allez supprimer "${subject.name}" du catalogue global. Cette action pourrait impacter les programmes de plusieurs niveaux.`,
        confirmLabel: 'Oui, supprimer la matière',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await firstValueFrom(this.academicService.deleteSubject(subject.id));
          this.notificationService.success('Matière retirée du catalogue.');
          this.loadData();
        } catch (error) {
          this.notificationService.error('Impossible de supprimer cette matière.');
        }
      }
    });
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
  }

  clearAllFilters() {
    this.searchQuery.set('');
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
}
