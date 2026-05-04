import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {BookOpen, ChevronRight, Clock, Layers, LayoutGrid, LucideAngularModule, Target, X} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../../../core/services/academic.service';
import {CurriculumItem, SyllabusChapter, SyllabusDomain} from '../../../../../../../core/models/academic.model';
import {NotificationService} from '../../../../../../../shared/services/notification.service';

@Component({
  selector: 'app-syllabus-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatDialogModule],
  templateUrl: './syllabus-viewer.html',
  styleUrls: ['./syllabus-viewer.scss']
})
export class SyllabusViewerComponent implements OnInit {
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<SyllabusViewerComponent>);
  data: { item: CurriculumItem } = inject(MAT_DIALOG_DATA);

  // Icônes
  readonly BookOpen = BookOpen;
  readonly Clock = Clock;
  readonly ChevronRight = ChevronRight;
  readonly X = X;
  readonly LayoutGrid = LayoutGrid;
  readonly Target = Target;
  readonly Layers = Layers;

  // États
  domains = signal<SyllabusDomain[]>([]);
  selectedDomainId = signal<string | null>(null);
  isLoading = signal(true);

  // Domaine sélectionné
  activeDomain = computed(() =>
    this.domains().find(d => d.id === this.selectedDomainId()) || null
  );

  // Chapitres du domaine actif
  activeChapters = computed<SyllabusChapter[]>(() => {
    const domain = this.activeDomain();
    return domain?.chapters || [];
  });

  /** Durée totale du domaine en semaines */
  totalDomainDuration = computed(() => {
    return this.activeChapters().reduce((sum, ch) => sum + (ch.estimatedDuration || 0), 0);
  });

  ngOnInit() {
    this.loadSyllabus();
  }

  async loadSyllabus() {
    this.isLoading.set(true);
    try {
      const syllabusData = await firstValueFrom(this.academicService.getSyllabus(this.data.item.id));
      this.domains.set(syllabusData);

      if (syllabusData.length > 0) {
        this.selectedDomainId.set(syllabusData[0].id);
      }
    } catch (error) {
      this.notificationService.error("Impossible de charger le syllabus.");
    } finally {
      this.isLoading.set(false);
    }
  }

  selectDomain(id: string) {
    this.selectedDomainId.set(id);
  }

  close() {
    this.dialogRef.close();
  }
}
