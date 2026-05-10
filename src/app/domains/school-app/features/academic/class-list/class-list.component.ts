import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BookOpenCheck, Filter, LucideAngularModule, Plus, RefreshCw, School, Users} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {firstValueFrom} from 'rxjs';
import {ClassFormComponent} from './components/class-form/class-form.component';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, CycleGroup, SchoolClass} from '../../../../../core/models/academic.model';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {Router} from '@angular/router';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {SharedFilterModalComponent} from '../../../../../shared/components/filter-modal/shared-filter-modal.component';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataListComponent,
    MatDialogModule,
    FwPageShellComponent,
    FwListCommandBarComponent,
    FwButtonComponent
  ],
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.scss']
})
export class ClassListComponent implements OnInit {
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Icônes
  readonly School = School;
  readonly Plus = Plus;
  readonly Users = Users;
  readonly BookOpenCheck = BookOpenCheck;
  readonly RefreshCw = RefreshCw;
  readonly Filter = Filter;

  // États
  currentYear = signal<AcademicYear | null>(null);
  classes = signal<SchoolClass[]>([]);
  groupedLevels = signal<CycleGroup[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');

  // Filtres
  selectedLevel = signal('');
  selectedYear = signal('');

  // Actions pour les classes
  readonly classActions: RowAction[] = [
    { id: 'view', label: 'Détails classe', icon: School, type: 'primary' },
    { id: 'teachings', label: 'Gérer les cours', icon: BookOpenCheck, type: 'success' },
    { id: 'view-students', label: 'Liste des élèves', icon: Users, type: 'default' }
  ];

  activeFilterChips = computed(() => {
    const chips: any[] = [];
    if (this.searchQuery()) chips.push({ key: 'q', label: 'Recherche', value: this.searchQuery() });
    if (this.selectedYear()) {
      const year = this.years().find(y => y.id === this.selectedYear());
      if (year) chips.push({ key: 'year', label: 'Année', value: year.label });
    }
    if (this.selectedLevel()) {
      const level = this.groupedLevels().flatMap(g => g.levels).find(l => l.id === this.selectedLevel());
      if (level) chips.push({ key: 'level', label: 'Niveau', value: level.name });
    }
    return chips;
  });

  years = signal<AcademicYear[]>([]);

  // Classes transformées pour le DataList
  displayClasses = computed<TableRow[]>(() => {
    return this.classes()
      .filter(c => {
        if (!this.searchQuery()) return true;
        return c.fullName.toLowerCase().includes(this.searchQuery().toLowerCase());
      })
      .map(c => ({
        id: c.id,
        title: c.fullName,
        subtitle: `${c.levelName || 'Niveau inconnu'} • Capacité: ${c.capacity} places`,
        avatarLabel: c.name,
        badges: [
          { label: 'OPÉRATIONNELLE', type: 'success' },
          { label: c.filiereCode || 'Tronc Commun', type: 'info' }
        ],
        metadata: {
          capacity: c.capacity,
          level: c.levelName
        },
        rawData: c
      }));
  });

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading.set(true);
    try {
      const [year, groupedData, allYears] = await Promise.all([
        firstValueFrom(this.academicService.getCurrentYear()),
        firstValueFrom(this.academicService.getGroupedLevels()),
        firstValueFrom(this.academicService.getYears())
      ]);

      this.currentYear.set(year);
      this.selectedYear.set(year.id);
      this.groupedLevels.set(groupedData);
      this.years.set(allYears);

      await this.loadClasses(year.id);
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement des classes.");
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadClasses(yearId: string) {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.academicService.getClassesByYear(yearId));
      this.classes.set(data);
    } catch (error) {
      console.error('Failed to load classes', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddClassForm() {
    const dialogRef = this.dialog.open(ClassFormComponent, {
      width: '540px',
      panelClass: 'feewi-dialog-panel',
      data: {
        year: this.currentYear(),
        groupedLevels: this.groupedLevels()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedYear()) {
        this.loadClasses(this.selectedYear());
      }
    });
  }

  openFilterModal() {
    const dialogRef = this.dialog.open(SharedFilterModalComponent, {
      width: '400px',
      data: {
        title: 'Filtrer les classes',
        fields: [
          {
            key: 'year',
            label: 'Année Scolaire',
            type: 'select',
            options: this.years().map(y => ({ label: y.label, value: y.id }))
          },
          {
            key: 'level',
            label: 'Niveau',
            type: 'select',
            groups: this.groupedLevels().map(g => ({
              label: g.cycle.customName || g.cycle.systemName || 'Cycle',
              options: g.levels.map(l => ({ label: l.name, value: l.id }))
            }))
          }
        ],
        initialValues: {
          year: this.selectedYear(),
          level: this.selectedLevel()
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedYear.set(result.year);
        this.selectedLevel.set(result.level);
        if (result.year) this.loadClasses(result.year);
      }
    });
  }

  handleClassAction(event: { actionId: string, row: TableRow }) {
    if (['view', 'teachings', 'view-students'].includes(event.actionId)) {
      this.router.navigate(['/admin/academic/classes', event.row.id]);
    } else if (event.actionId === 'edit') {
       // Open edit form
    }
  }

  removeFilter(key: string) {
    if (key === 'q') this.searchQuery.set('');
    if (key === 'year') { this.selectedYear.set(this.currentYear()?.id || ''); this.loadClasses(this.selectedYear()); }
    if (key === 'level') this.selectedLevel.set('');
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.selectedYear.set(this.currentYear()?.id || '');
    this.selectedLevel.set('');
    this.loadClasses(this.selectedYear());
  }
}
