import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, School, Plus, Users, BookOpenCheck } from 'lucide-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClassFormComponent } from './components/class-form/class-form.component';
import { TeachingManagerComponent } from './components/teaching-manager/teaching-manager';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {AcademicService} from '../../../../../core/services/academic.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, Level, SchoolClass} from '../../../../../core/models/academic.model';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DataListComponent, MatDialogModule],
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.scss']
})
export class ClassListComponent implements OnInit {
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Icônes
  readonly School = School;
  readonly Plus = Plus;
  readonly Users = Users;
  readonly BookOpenCheck = BookOpenCheck;

  // États
  currentYear = signal<AcademicYear | null>(null);
  classes = signal<SchoolClass[]>([]);
  levels = signal<Level[]>([]);
  isLoading = signal(true);

  // Actions pour les classes
  readonly classActions: RowAction[] = [
    { id: 'teachings', label: 'Gérer les cours', icon: BookOpenCheck, type: 'success' },
    { id: 'edit', label: 'Modifier', icon: School, type: 'primary' },
    { id: 'view-students', label: 'Liste des élèves', icon: Users, type: 'default' }
  ];

  // Classes transformées pour le DataList
  displayClasses = computed<TableRow[]>(() => {
    return this.classes().map(c => ({
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
      const year = await this.academicService.getCurrentYear();
      this.currentYear.set(year);

      const levelsData = await this.academicService.getLevels();
      this.levels.set(levelsData);

      await this.loadClasses(year.id);
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement des classes.");
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadClasses(yearId: string) {
    try {
      const data = await this.academicService.getClassesByYear(yearId);
      this.classes.set(data);
    } catch (error) {
      console.error('Failed to load classes', error);
    }
  }

  openAddClassForm() {
    const dialogRef = this.dialog.open(ClassFormComponent, {
      width: '540px',
      panelClass: 'feewi-dialog-panel',
      data: {
        year: this.currentYear(),
        levels: this.levels()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.currentYear()) {
        this.loadClasses(this.currentYear()!.id);
      }
    });
  }

  handleClassAction(event: { actionId: string, row: TableRow }) {
    if (event.actionId === 'teachings') {
      this.openTeachingManager(event.row.rawData);
    } else {
      this.notificationService.info(`Action ${event.actionId} sur ${event.row.title}`);
    }
  }

  private openTeachingManager(schoolClass: SchoolClass) {
    this.dialog.open(TeachingManagerComponent, {
      width: '1000px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel',
      data: { schoolClass }
    });
  }
}
