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
  PillarConfig,
  YearOverrideConfig
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
  availableYears = signal<AcademicYear[]>([]); // Toutes les années du système

  isLoading = signal(true);
  isSaving = signal(false);

  // Navigation CMS
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

  // --- CALCULS RÉACTIFS ---

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

  activeChecklist = computed(() => this.config()?.documentChecklist || []);

  assessmentSubjectsList = computed(() => {
    const subjects = this.config()?.assessmentConfig?.subjects || {};
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
        // Sécurité V5 : Initialisation des verrous
        if (!config.yearOverrides) config.yearOverrides = {};
        if (!config.assessmentConfig) {
          config.assessmentConfig = { type: 'DOSSIER', subjectsEnabled: false, subjects: {}, minPassingGrade: 10 };
        }

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
      const override: LevelOverrideConfig = { active: true, full: false };
      obs$ = this.enrollmentService.updateLevelOverride(this.selectedLevelId()!, override);
    }

    obs$.pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.notificationService.success('Configuration publiée.');
        this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      },
      error: () => this.notificationService.error('Erreur de sauvegarde.')
    });
  }

  setScope(scope: ConfigScope, levelId: string | null = null) {
    this.currentScope.set(scope);
    this.selectedLevelId.set(levelId);
  }

  // --- GESTION TEMPORELLE (V5) ---

  isYearActive(yearId: string): boolean {
    const config = this.config();
    if (!config) return false;
    // Si pas de surcharge, l'année est considérée active par défaut
    return config.yearOverrides[yearId]?.active ?? true;
  }

  toggleYearVisibility(yearId: string) {
    const current = this.config();
    if (current) {
      const overrides = { ...current.yearOverrides };
      const currentStatus = overrides[yearId]?.active ?? true;
      overrides[yearId] = { ...overrides[yearId], active: !currentStatus };
      this.config.set({ ...current, yearOverrides: overrides });
    }
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
    const checklist = current.documentChecklist.map(doc => doc.code === code ? { ...doc, mandatory } : doc);
    this.config.set({ ...current, documentChecklist: checklist });
  }

  addDocumentType() {
    const dialogRef = this.dialog.open(DocumentTypeFormComponent, { width: '450px', panelClass: 'feewi-dialog-panel' });
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.config()) {
        const current = this.config()!;
        this.config.set({ ...current, documentChecklist: [...current.documentChecklist, result] });
      }
    });
  }

  removeDocumentType(code: string) {
    const current = this.config();
    if (!current) return;
    this.config.set({ ...current, documentChecklist: current.documentChecklist.filter(d => d.code !== code) });
  }

  // --- GESTION DE L'ÉVALUATION ---

  updateAssessmentType(type: any) {
    const current = this.config();
    if (current) {
      this.config.set({ ...current, assessmentConfig: { ...current.assessmentConfig, type } });
    }
  }

  updateMinPassingGrade(grade: number) {
    const current = this.config();
    if (current) {
      this.config.set({ ...current, assessmentConfig: { ...current.assessmentConfig, minPassingGrade: grade } });
    }
  }

  addSubject(input: HTMLInputElement) {
    const val = input.value.trim();
    const current = this.config();
    if (val && current) {
      const subjects = { ...current.assessmentConfig.subjects };
      if (!subjects[val]) {
        subjects[val] = 1;
        this.config.set({ ...current, assessmentConfig: { ...current.assessmentConfig, subjects } });
        input.value = '';
      }
    }
  }

  updateSubjectCoef(subject: string, coef: number) {
    const current = this.config();
    if (current) {
      const subjects = { ...current.assessmentConfig.subjects, [subject]: coef };
      this.config.set({ ...current, assessmentConfig: { ...current.assessmentConfig, subjects } });
    }
  }

  removeSubject(subject: string) {
    const current = this.config();
    if (current) {
      const subjects = { ...current.assessmentConfig.subjects };
      delete subjects[subject];
      this.config.set({ ...current, assessmentConfig: { ...current.assessmentConfig, subjects } });
    }
  }

  // --- ACTIONS DE MAINTENANCE ---

  resetToSystemDefaults() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: { title: 'Réinitialiser ?', message: 'Restaurer les 4 piliers système par défaut ?', confirmLabel: 'Réinitialiser', type: 'danger' }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.enrollmentService.resetConfig().pipe(
          switchMap(() => this.enrollmentService.getConfig()),
          finalize(() => this.isLoading.set(false))
        ).subscribe(config => {
          this.config.set(config);
          this.initialConfig.set(JSON.parse(JSON.stringify(config)));
          this.notificationService.success('Standards système restaurés.');
        });
      }
    });
  }

  togglePortal() {
    const current = this.config();
    if (!current) return;
    const newStatus = !current.portalActive;
    this.isSaving.set(true);
    this.enrollmentService.updatePortalStatus(newStatus).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.config.set({ ...current, portalActive: newStatus });
        this.notificationService.info(newStatus ? 'Portail ouvert.' : 'Portail fermé.');
      }
    });
  }

  previewPortal() {
    this.dialog.open(PortalPreviewDialogComponent, {
      width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh',
      panelClass: 'full-screen-dialog',
      data: { config: this.config(), activeYear: this.activeYear() }
    });
  }

  // Icônes
  readonly Settings2 = Settings2;
  readonly Eye = Eye;
  readonly Save = Save;
  readonly RefreshCw = RefreshCw;
  readonly Globe = Globe;
  readonly GraduationCap = GraduationCap;
  readonly ShieldCheck = ShieldCheck;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly BookOpen = BookOpen;
  readonly X = X;
  readonly Sparkles = Sparkles;
  readonly Info = Info;
  readonly MessageSquare = MessageSquare;
  readonly Layout = Layout;
  readonly Type = Type;
  readonly Hash = Hash;
  readonly Lock = Lock;
  readonly ChevronRight = ChevronRight;
  readonly ClipboardList = ClipboardList;
  readonly Calendar = Calendar;
  readonly HeartPulse = HeartPulse;
  readonly Users = Users;
  readonly School = School;
  protected readonly FileText = FileText;
  protected readonly LayoutGrid = LayoutGrid;
}
