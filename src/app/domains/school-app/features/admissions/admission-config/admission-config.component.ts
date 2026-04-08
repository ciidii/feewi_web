import { Component, inject, signal, OnInit, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Globe, Save, RefreshCw, Eye,
  Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon,
  ChefHat, Bus, MessageSquare, Plus, Trash2, Settings2,
  GraduationCap, Info, AlertTriangle, LayoutGrid, UserCog, ClipboardCheck, BookOpen, X, Sparkles,
  HeartPulse, Users, School, Layout, Type, Hash, Lock, ChevronRight, ClipboardList
} from 'lucide-angular';
import { finalize, forkJoin, Observable, of, switchMap } from 'rxjs';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import {
  EnrollmentConfig,
  RequiredDocumentConfig,
  FieldConfig,
  LevelOverrideConfig,
  AssessmentConfig,
  PillarConfig
} from '../../../../../core/models/enrollment.model';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AcademicYear, Level } from '../../../../../core/models/academic.model';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { DocumentTypeFormComponent } from './components/document-type-form/document-type-form.component';
import { CustomFieldFormComponent } from './components/custom-field-form/custom-field-form.component';
import { PortalPreviewDialogComponent } from './components/portal-preview-dialog/portal-preview-dialog.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';

export type ConfigTab = 'PILLARS' | 'DOCUMENTS' | 'ASSESSMENT' | 'WORKFLOW';
export type ConfigScope = 'GLOBAL' | 'LEVEL';

@Component({
  selector: 'app-admission-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSelectModule
  ],
  templateUrl: './admission-config.component.html',
  styleUrls: ['./admission-config.component.scss']
})
export class AdmissionConfigComponent implements OnInit {
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  @ViewChild('subjectInput') subjectInput?: ElementRef<HTMLInputElement>;

  // --- ÉTATS ---
  config = signal<EnrollmentConfig | null>(null);
  initialConfig = signal<EnrollmentConfig | null>(null);
  activeYear = signal<AcademicYear | null>(null);
  levels = signal<Level[]>([]);
  availableYears = signal<AcademicYear[]>([]);

  isLoading = signal(true);
  isSaving = signal(false);

  currentScope = signal<ConfigScope>('GLOBAL');
  selectedLevelId = signal<string | null>(null);
  activeTab = signal<ConfigTab>('PILLARS');
  activePillarKey = signal<string>('pillar_identity');

  selectedLevelName = computed(() => {
    const id = this.selectedLevelId();
    if (!id) return '';
    return this.levels().find(l => l.id === id)?.name || id;
  });

  readonly systemPillars = [
    { key: 'pillar_identity', label: 'Identité', icon: UserCog },
    { key: 'pillar_medical', label: 'Santé', icon: HeartPulse },
    { key: 'pillar_family', label: 'Famille', icon: Users },
    { key: 'pillar_schooling', label: 'Scolarité', icon: School }
  ];

  isDirty = computed(() => {
    const current = this.config();
    const initial = this.initialConfig();
    if (!current || !initial) return false;
    return JSON.stringify(current) !== JSON.stringify(initial);
  });

  activePillar = computed<PillarConfig | null>(() => {
    const cfg = this.config();
    if (!cfg) return null;
    return cfg.pillars[this.activePillarKey()] || null;
  });

  activeChecklist = computed(() => this.config()?.defaultChecklist || []);

  assessmentSubjectsList = computed(() => {
    const subjects = this.config()?.defaultAssessmentConfig?.subjects || {};
    return Object.entries(subjects).map(([name, coef]) => ({ name, coef }));
  });

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      config: this.enrollmentService.getConfig(),
      activeYear: this.academicService.getCurrentYear(),
      allYears: this.academicService.getYears(),
      levels: this.academicService.getLevels()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ config, activeYear, allYears, levels }) => {
        // Sécurité V5 : Aligner sur le JSON Backend
        if (!config.defaultAssessmentConfig) {
          config.defaultAssessmentConfig = { type: 'DOSSIER', subjectsEnabled: false, subjects: {}, minPassingGrade: 10 };
        }
        if (!config.defaultChecklist) config.defaultChecklist = [];
        if (!config.yearOverrides) config.yearOverrides = {};

        // Alias pour compatibilité templates
        config.assessmentConfig = config.defaultAssessmentConfig;
        config.documentChecklist = config.defaultChecklist;

        this.config.set(config);
        this.initialConfig.set(JSON.parse(JSON.stringify(config)));
        this.activeYear.set(activeYear);
        this.availableYears.set(allYears);
        this.levels.set(levels);
      },
      error: (err) => console.error('[AdmissionConfig] Erreur initialisation:', err)
    });
  }

  onSave() {
    const currentConfig = this.config();
    if (!currentConfig) return;

    this.isSaving.set(true);
    let obs$: Observable<any>;

    if (this.currentScope() === 'GLOBAL') {
      obs$ = this.enrollmentService.updateConfig(currentConfig);
    } else {
      const override: LevelOverrideConfig = {
        active: true,
        full: currentConfig.levelOverrides[this.selectedLevelId()!]?.full ?? false,
        pillarOverrides: currentConfig.pillars,
        assessmentConfig: currentConfig.defaultAssessmentConfig
      };
      obs$ = this.enrollmentService.updateLevelOverride(this.selectedLevelId()!, override);
    }

    obs$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.notificationService.success('Configuration publiée.');
        this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      }
    });
  }

  setScope(scope: ConfigScope, levelId: string | null = null) {
    this.currentScope.set(scope);
    this.selectedLevelId.set(levelId);
  }

  // --- GESTION DES CHAMPS ---

  updateSystemField(fieldName: string, patch: Partial<FieldConfig>) {
    const current = this.config();
    if (!current) return;
    const pillarKey = this.activePillarKey();
    const pillar = { ...current.pillars[pillarKey] };
    pillar.systemFields = pillar.systemFields.map(f => f.name === fieldName ? { ...f, ...patch } : f);
    this.config.set({ ...current, pillars: { ...current.pillars, [pillarKey]: pillar } });
  }

  addCustomField() {
    const dialogRef = this.dialog.open(CustomFieldFormComponent, { width: '500px', panelClass: 'feewi-dialog-panel' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const current = this.config();
        if (!current) return;
        const pillarKey = this.activePillarKey();
        const pillar = { ...current.pillars[pillarKey] };
        pillar.customFields = [...pillar.customFields, result];
        this.config.set({ ...current, pillars: { ...current.pillars, [pillarKey]: pillar } });
      }
    });
  }

  removeCustomField(fieldName: string) {
    const current = this.config();
    if (!current) return;
    const pillarKey = this.activePillarKey();
    const pillar = { ...current.pillars[pillarKey] };
    pillar.customFields = pillar.customFields.filter(f => f.name !== fieldName);
    this.config.set({ ...current, pillars: { ...current.pillars, [pillarKey]: pillar } });
  }

  // --- GESTION DES DOCUMENTS ---

  updateDocumentMandatory(code: string, mandatory: boolean) {
    const current = this.config();
    if (!current) return;
    const checklist = current.defaultChecklist.map(doc => doc.code === code ? { ...doc, mandatory } : doc);
    this.config.set({
      ...current,
      defaultChecklist: checklist,
      documentChecklist: checklist // Alias
    });
  }

  addDocumentType() {
    const dialogRef = this.dialog.open(DocumentTypeFormComponent, { width: '450px', panelClass: 'feewi-dialog-panel' });
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.config()) {
        const current = this.config()!;
        const updated = [...current.defaultChecklist, result];
        this.config.set({
          ...current,
          defaultChecklist: updated,
          documentChecklist: updated // Alias
        });
      }
    });
  }

  removeDocumentType(code: string) {
    const current = this.config();
    if (!current) return;
    const updated = current.defaultChecklist.filter(d => d.code !== code);
    this.config.set({
      ...current,
      defaultChecklist: updated,
      documentChecklist: updated // Alias
    });
  }

  // --- GESTION DE L'ÉVALUATION ---

  updateAssessmentType(type: any) {
    const current = this.config();
    if (current && current.defaultAssessmentConfig) {
      const updated = { ...current.defaultAssessmentConfig, type };
      this.config.set({
        ...current,
        defaultAssessmentConfig: updated,
        assessmentConfig: updated // Alias
      });
    }
  }

  updateMinPassingGrade(grade: number) {
    const current = this.config();
    if (current && current.defaultAssessmentConfig) {
      const updated = { ...current.defaultAssessmentConfig, minPassingGrade: grade };
      this.config.set({
        ...current,
        defaultAssessmentConfig: updated,
        assessmentConfig: updated // Alias
      });
    }
  }

  addSubject(input: HTMLInputElement) {
    const val = input.value.trim();
    const current = this.config();
    if (val && current && current.defaultAssessmentConfig) {
      const subjects = { ...current.defaultAssessmentConfig.subjects };
      subjects[val] = 1;
      const updated = { ...current.defaultAssessmentConfig, subjects };
      this.config.set({
        ...current,
        defaultAssessmentConfig: updated,
        assessmentConfig: updated // Alias
      });
      input.value = '';
    }
  }

  updateSubjectCoef(subject: string, coef: number) {
    const current = this.config();
    if (current && current.defaultAssessmentConfig) {
      const subjects = { ...current.defaultAssessmentConfig.subjects, [subject]: coef };
      const updated = { ...current.defaultAssessmentConfig, subjects };
      this.config.set({
        ...current,
        defaultAssessmentConfig: updated,
        assessmentConfig: updated // Alias
      });
    }
  }

  removeSubject(subject: string) {
    const current = this.config();
    if (current && current.defaultAssessmentConfig) {
      const subjects = { ...current.defaultAssessmentConfig.subjects };
      delete subjects[subject];
      const updated = { ...current.defaultAssessmentConfig, subjects };
      this.config.set({
        ...current,
        defaultAssessmentConfig: updated,
        assessmentConfig: updated // Alias
      });
    }
  }

  // --- MAINTENANCE ---

  resetToSystemDefaults() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Réinitialisation d\'usine',
        message: 'Êtes-vous absolument sûr ? Cette action supprimera tous vos champs personnalisés, vos documents et votre politique d\'évaluation pour restaurer les standards Feewi. Cette opération est irréversible.',
        confirmLabel: 'Réinitialiser tout',
        cancelLabel: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.enrollmentService.resetConfig().pipe(
          finalize(() => this.isLoading.set(false))
        ).subscribe({
          next: () => {
            this.notificationService.success('La configuration a été réinitialisée avec succès.');
            this.loadInitialData();
          }
        });
      }
    });
  }

  togglePortal() {
    const current = this.config();
    if (!current) return;
    this.enrollmentService.updatePortalStatus(!current.portalActive).subscribe(() => this.loadInitialData());
  }

  previewPortal() {
    this.dialog.open(PortalPreviewDialogComponent, {
      width: '100vw', height: '100vh', data: { config: this.config(), activeYear: this.activeYear() }
    });
  }

  isYearActive(id: string) { return this.config()?.yearOverrides[id]?.active ?? true; }
  toggleYearVisibility(id: string) {
    const current = this.config();
    if (current) {
      const active = !this.isYearActive(id);
      const yearOverrides = { ...current.yearOverrides, [id]: { active } };
      this.config.set({ ...current, yearOverrides });
    }
  }

  readonly Settings2 = Settings2;
  readonly Eye = Eye;
  readonly Save = Save;
  readonly RefreshCw = RefreshCw;
  readonly Globe = Globe;
  readonly GraduationCap = GraduationCap;
  readonly ShieldCheck = ShieldCheck;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Sparkles = Sparkles;
  readonly Info = Info;
  readonly MessageSquare = MessageSquare;
  readonly Layout = Layout;
  readonly Lock = Lock;
  readonly ChevronRight = ChevronRight;
  readonly ClipboardList = ClipboardList;
  readonly Calendar = Calendar;
  readonly HeartPulse = HeartPulse;
  readonly Users = Users;
  readonly School = School;
  protected readonly FileText = FileText;
  protected readonly LayoutGrid = LayoutGrid;
  readonly Type = Type;
  readonly Hash = Hash;
  readonly ToggleIcon = ToggleIcon;
  protected readonly AlertTriangle = AlertTriangle;
}
