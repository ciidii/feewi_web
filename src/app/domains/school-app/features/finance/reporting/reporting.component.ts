import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BarChart3, GraduationCap, Loader2, LucideAngularModule, TrendingUp} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {AcademicService} from '../../../../../core/services/academic.service';
import {BillingService} from '../../../../../core/services/billing.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {SchoolClass} from '../../../../../core/models/academic.model';
import {AggregateGroupRequest, AggregateGroupTotals, AggregateReportResponse} from '../../../../../core/models/billing.model';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';

interface LevelOption {
  id: string;
  name: string;
}

/** Ligne du tableau "Créances par classe" — le groupe agrégé, résolu avec le nom de classe. */
interface ReportRow extends AggregateGroupTotals {
  className: string;
}

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwEmptyStateComponent,
    FwButtonComponent
  ],
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss']
})
export class ReportingComponent implements OnInit {
  private academicService = inject(AcademicService);
  private billingService = inject(BillingService);
  private notificationService = inject(NotificationService);

  // Icônes
  readonly TrendingUp = TrendingUp;
  readonly GraduationCap = GraduationCap;
  readonly BarChart3 = BarChart3;
  readonly Loader2 = Loader2;

  // Référentiel classes de l'année en cours
  classes = signal<SchoolClass[]>([]);
  isLoadingClasses = signal(true);
  selectedLevelId = signal<string>('');

  // Rapport agrégé (BL-BILL-04)
  report = signal<AggregateReportResponse | null>(null);
  isGenerating = signal(false);

  // Niveaux distincts dérivés des classes chargées — pas d'appel réseau dédié (ADR-005).
  levels = computed<LevelOption[]>(() => {
    const map = new Map<string, string>();
    for (const cls of this.classes()) {
      if (cls.levelId && !map.has(cls.levelId)) {
        map.set(cls.levelId, cls.levelName || cls.levelId);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({id, name}));
  });

  // Classes dans le périmètre du rapport (établissement entier si aucun niveau sélectionné)
  classesInScope = computed<SchoolClass[]>(() => {
    const levelId = this.selectedLevelId();
    return levelId ? this.classes().filter(cls => cls.levelId === levelId) : this.classes();
  });

  private classById = computed(() => {
    const map = new Map<string, SchoolClass>();
    for (const cls of this.classes()) {
      map.set(cls.id, cls);
    }
    return map;
  });

  // Lignes du tableau, résolues groupKey -> nom de classe. Les classes vides restent affichées.
  rows = computed<ReportRow[]>(() => {
    const report = this.report();
    if (!report) return [];
    const classMap = this.classById();
    return report.groups.map(group => ({
      ...group,
      className: classMap.get(group.groupKey || '')?.fullName || group.groupKey || 'Classe inconnue'
    }));
  });

  ngOnInit() {
    this.loadClasses();
  }

  private async loadClasses() {
    this.isLoadingClasses.set(true);
    try {
      const year = await firstValueFrom(this.academicService.getCurrentYear());
      const classes = await firstValueFrom(this.academicService.getClassesByYear(year.id));
      this.classes.set(classes);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoadingClasses.set(false);
    }
  }

  onLevelChange(levelId: string) {
    this.selectedLevelId.set(levelId);
    // Un changement de périmètre invalide un rapport déjà généré : on n'affiche jamais
    // un rapport qui ne correspond plus au filtre courant.
    this.report.set(null);
  }

  async generateReport() {
    const classesInScope = this.classesInScope();
    if (classesInScope.length === 0) {
      this.notificationService.error('Aucune classe dans le périmètre sélectionné.');
      return;
    }

    this.isGenerating.set(true);
    try {
      // Rosters récupérés en parallèle (potentiellement des dizaines de classes) — pas de boucle séquentielle.
      const rosters = await Promise.all(
        classesInScope.map(cls => firstValueFrom(this.academicService.getRoster(cls.id)))
      );

      const groups: AggregateGroupRequest[] = classesInScope.map((cls, index) => ({
        groupKey: cls.id,
        studentIds: rosters[index].map(student => student.studentId)
      }));

      // Un seul appel HTTP pour tous les groupes (ADR-005) — pas de sommation partielle côté client.
      const report = await firstValueFrom(this.billingService.getAggregateReport(groups));
      this.report.set(report);
    } catch (e) {
      // La notification d'erreur est déjà déclenchée par AcademicService/BillingService.handleError
    } finally {
      this.isGenerating.set(false);
    }
  }

  formatAmount(value: number): string {
    return `${(value ?? 0).toLocaleString('fr-FR')} FCFA`;
  }

  formatRate(rate: number | null | undefined): string {
    if (rate === null || rate === undefined) return '—';
    return `${(rate * 100).toLocaleString('fr-FR', {minimumFractionDigits: 1, maximumFractionDigits: 1})} %`;
  }
}
