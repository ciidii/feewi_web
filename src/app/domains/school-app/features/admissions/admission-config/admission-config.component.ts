import {Component, computed, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  ClipboardList,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Hash,
  HeartPulse,
  Info,
  LayoutGrid,
  Lock,
  LucideAngularModule,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  School,
  Settings2,
  ShieldCheck,
  Sparkles,
  ToggleLeft as ToggleIcon,
  Trash2,
  UserCog,
  Users,
  Wrench
} from 'lucide-angular';
import {finalize, forkJoin, Observable} from 'rxjs';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {
  CycleOverrideConfig,
  EnrollmentConfig,
  FieldConfig,
  LevelOverrideConfig,
  PresetDocumentConfig,
  ServiceConfig,
  ServicesSchemaConfig,
  YearOverrideConfig
} from '../../../../../core/models/enrollment.model';
import { CycleType } from '../../../../../core/models/enrollment/base-types';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {AcademicYear, Cycle, Level} from '../../../../../core/models/academic.model';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DocumentTypeFormComponent} from './components/document-type-form/document-type-form.component';
import {CustomFieldFormComponent} from './components/custom-field-form/custom-field-form.component';
import {PortalPreviewDialogComponent} from './components/portal-preview-dialog/portal-preview-dialog.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {ServiceFormComponent} from './components/service-form/service-form.component';

import { FwPageShellComponent } from '../../../../../shared/components/page-shell/page-shell.component';
import { FwButtonComponent } from '../../../../../shared/components/button/button.component';
import { FwTab } from '../../../../../shared/components/tabs/tabs.component';
import { PageProgressComponent } from '../../../../../shared/components/loader/page-progress.component';

export type ConfigTab = 'PILLARS' | 'DOCUMENTS' | 'ASSESSMENT' | 'SERVICES' | 'WORKFLOW';
export type ConfigScope = 'GLOBAL' | 'LEVEL' | 'YEAR' | 'CYCLE';

@Component({
  selector: 'app-admission-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    MatDialogModule,
    FwPageShellComponent,
    FwButtonComponent,
    PageProgressComponent
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

  // --- STATE ---
  config = signal<EnrollmentConfig | null>(null);
  initialConfig = signal<EnrollmentConfig | null>(null);
  activeYear = signal<AcademicYear | null>(null);
  levels = signal<Level[]>([]);
  academicCycles = signal<Cycle[]>([]);
  availableYears = signal<AcademicYear[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  currentScope = signal<ConfigScope>('GLOBAL');
  selectedLevelId = signal<string | null>(null);
  selectedYearId = signal<string | null>(null);
  activeTab = signal<ConfigTab>('PILLARS');
  activePillarKey = signal<string>('identity');

  // Onglets intégrés au Shell (visibles uniquement en scope GLOBAL)
  readonly admissionTabs: FwTab[] = [
    { id: 'PILLARS', label: 'Formulaire', icon: LayoutGrid },
    { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
    { id: 'ASSESSMENT', label: 'Évaluation', icon: ClipboardList },
    { id: 'SERVICES', label: 'Services', icon: Wrench },
    { id: 'WORKFLOW', label: 'Paramètres', icon: ShieldCheck }
  ];

  // Year override local form state (isolated from global config)
  yearOverrideForm = signal<YearOverrideConfig>({
    enrollmentOpen: true,
    openFrom: null,
    openUntil: null,
    allowedTypes: ['NEW_ENROLLMENT', 'RE_ENROLLMENT'],
    registrationMode: null,
    welcomeMessage: null
  });
  isYearOverrideSaving = signal(false);

  // Level override local form state (isolated from global config)
  levelOverrideForm = signal<LevelOverrideConfig>({
    active: true,
    maxNewEnrollments: null,
    additionalDocuments: [],
    assessment: null
  });
  isLevelOverrideSaving = signal(false);

  // Cycle override local form state (isolated from global config)
  cycleOverrideForm = signal<CycleOverrideConfig>({
    assessment: null,
    additionalDocuments: [],
    additionalServices: []
  });
  selectedCycleType = signal<CycleType | null>(null);
  isCycleOverrideSaving = signal(false);

  // --- STATIC DATA ---
  readonly cycles: { type: CycleType; label: string; icon: any }[] = [
    { type: 'MATERNAL',     label: 'Préscolaire / Maternelle', icon: Sparkles     },
    { type: 'PRIMARY',      label: 'École primaire',           icon: School       },
    { type: 'MIDDLE_SCHOOL',label: 'Collège',                  icon: Users        },
    { type: 'HIGH_SCHOOL',  label: 'Lycée',                    icon: GraduationCap},
  ];

  readonly systemPillars = [
    {key: 'identity',  label: 'Identité',  icon: UserCog},
    {key: 'medical',   label: 'Santé',     icon: HeartPulse},
    {key: 'family',    label: 'Famille',   icon: Users},
    {key: 'schooling', label: 'Scolarité', icon: School}
  ];

  readonly assessmentTypes = [
    {value: 'DOSSIER',   label: 'Dossier',   desc: 'Étude des pièces uniquement',     icon: ClipboardList},
    {value: 'EXAM',      label: 'Examen',    desc: 'Notes sur matières définies',     icon: Hash},
    {value: 'INTERVIEW', label: 'Entretien', desc: 'Évaluation orale de motivation',  icon: MessageSquare}
  ];

  readonly registrationModes = [
    {value: 'PARENT_ONLY', label: 'Portail parents', desc: 'Inscription en ligne uniquement',   icon: Users},
    {value: 'ADMIN_ONLY',  label: 'Guichet seul',    desc: 'Saisie directe par le secrétariat', icon: UserCog},
    {value: 'BOTH',        label: 'Mode mixte',      desc: 'Portail et guichet activés',         icon: Globe}
  ];

  // --- COMPUTED ---
  selectedLevelName = computed(() => {
    const id = this.selectedLevelId();
    return id ? (this.levels().find(l => l.id === id)?.name || id) : '';
  });

  selectedYearName = computed(() => {
    const id = this.selectedYearId();
    return id ? (this.availableYears().find(y => y.id === id)?.label || id) : '';
  });

  selectedCycleName = computed(() => {
    const t = this.selectedCycleType();
    return t ? (this.cycles.find(c => c.type === t)?.label || t) : '';
  });

  levelsByCycle = computed(() => {
    const allLevels = this.levels();
    const allCycles = this.academicCycles();
    
    // Map pour retrouver le cycleCode par ID de cycle
    const cycleCodeMap = new Map<string, string>();
    allCycles.forEach(c => cycleCodeMap.set(c.id, c.cycleCode));

    return this.cycles
      .map(c => {
        const matchingLevels = allLevels
          .filter(l => {
            const levelCycleCode = cycleCodeMap.get(l.cycleId) || l.cycle?.cycleCode;
            return levelCycleCode === c.type;
          })
          .sort((a, b) => a.rank - b.rank);
          
        return {
          cycle: c,
          levels: matchingLevels
        };
      })
      .filter(g => g.levels.length > 0 || this.hasCycleOverride(g.cycle.type));
  });

  isDirty = computed(() => {
    const c = this.config(), i = this.initialConfig();
    return !!(c && i && JSON.stringify(c) !== JSON.stringify(i));
  });

  activePillar = computed<any>(() => {
    const cfg = this.config();
    if (!cfg) return null;
    return (cfg.schema as Record<string, any>)[this.activePillarKey()] || null;
  });

  activePillarLabel = computed(() =>
    this.systemPillars.find(p => p.key === this.activePillarKey())?.label || ''
  );

  activePillarCoreFields = computed<{name: string; label: string}[]>(() => {
    const pillar = this.activePillar();
    if (!pillar) return [];
    const controls = this.activePillarKey() === 'family'
      ? pillar.guardianCoreFieldControls
      : pillar.coreFieldControls;
    if (!controls) return [];
    return Object.entries(controls as Record<string, any>).map(([name, ctrl]) => ({name, label: ctrl.label as string}));
  });

  activePillarCustomFields = computed<FieldConfig[]>(() => {
    const pillar = this.activePillar();
    if (!pillar) return [];
    return (this.activePillarKey() === 'family' ? pillar.guardianCustomFields : pillar.customFields) || [];
  });

  activeChecklist = computed(() => this.config()?.schema?.documents?.presetDocuments || []);

  assessmentSubjectsList = computed(() =>
    Object.entries(this.config()?.schema?.assessment?.subjects || {})
      .map(([name, coef]) => ({name, coef}))
  );

  activeServices = computed<ServiceConfig[]>(() =>
    this.config()?.schema?.services?.availableServices || []
  );

  servicesEnabled = computed(() =>
    this.config()?.schema?.services?.enabled ?? false
  );

  hasYearOverride(yearId: string): boolean {
    return !!(this.config() as any)?.yearOverrides?.[yearId];
  }

  hasLevelOverride(levelId: string): boolean {
    return !!(this.config() as any)?.levelOverrides?.[levelId];
  }

  hasCycleOverride(cycleType: CycleType): boolean {
    return !!(this.config()?.cycleOverrides?.[cycleType]);
  }

  levelDocsList = computed<PresetDocumentConfig[]>(() =>
    this.levelOverrideForm().additionalDocuments || []
  );

  levelAssessmentEnabled = computed(() => !!this.levelOverrideForm().assessment);

  cycleDocsList = computed<PresetDocumentConfig[]>(() =>
    this.cycleOverrideForm().additionalDocuments || []
  );

  cycleServicesList = computed<ServiceConfig[]>(() =>
    this.cycleOverrideForm().additionalServices || []
  );

  cycleAssessmentEnabled = computed(() => !!this.cycleOverrideForm().assessment);

  cycleAssessmentSubjectsList = computed(() =>
    Object.entries(this.cycleOverrideForm().assessment?.subjects || {})
      .map(([name, coef]) => ({name, coef}))
  );

  levelAssessmentSubjectsList = computed(() =>
    Object.entries(this.levelOverrideForm().assessment?.subjects || {})
      .map(([name, coef]) => ({name, coef}))
  );

  // --- HELPERS ---
  isPillarEnabled(key: string): boolean {
    if (key === 'identity') return true;
    const cfg = this.config();
    if (!cfg) return true;
    return (cfg.schema as any)[key]?.enabled !== false;
  }

  // --- LIFECYCLE ---
  ngOnInit() { this.loadInitialData(); }

  loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      config: this.enrollmentService.getConfig(),
      activeYear: this.academicService.getCurrentYear(),
      allYears: this.academicService.getYears(),
      levels: this.academicService.getLevels(),
      cycles: this.academicService.getCycles()
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: ({config, activeYear, allYears, levels, cycles}) => {
        if (!config.schema.assessment)
          config.schema.assessment = {type: 'DOSSIER', subjects: {}, maxGrade: 20, minPassingGrade: 10};
        if (!config.schema.documents.presetDocuments)
          config.schema.documents.presetDocuments = [];
        if (!config.schema.services)
          config.schema.services = {enabled: false, availableServices: []};
        this.config.set(config);
        this.initialConfig.set(JSON.parse(JSON.stringify(config)));
        this.activeYear.set(activeYear);
        this.availableYears.set(allYears);
        this.levels.set(levels);
        this.academicCycles.set(cycles);
      },
      error: (err) => console.error('[AdmissionConfig]', err)
    });
  }

  onSave() {
    const cfg = this.config();
    if (!cfg || this.currentScope() !== 'GLOBAL') return;
    this.isSaving.set(true);
    this.enrollmentService.updateConfig(cfg)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Configuration publiée.');
          this.initialConfig.set(JSON.parse(JSON.stringify(cfg)));
        }
      });
  }

  setScope(scope: ConfigScope, id: string | null = null) {
    this.currentScope.set(scope);
    if (scope === 'LEVEL') {
      this.selectedLevelId.set(id);
      this.selectedYearId.set(null);
      this.selectedCycleType.set(null);
      this.loadLevelOverrideForm(id!);
    } else if (scope === 'YEAR') {
      this.selectedYearId.set(id);
      this.selectedLevelId.set(null);
      this.selectedCycleType.set(null);
      this.loadYearOverrideForm(id!);
    } else if (scope === 'CYCLE') {
      this.selectedCycleType.set(id as CycleType);
      this.selectedLevelId.set(null);
      this.selectedYearId.set(null);
      this.loadCycleOverrideForm(id as CycleType);
    } else {
      this.selectedLevelId.set(null);
      this.selectedYearId.set(null);
      this.selectedCycleType.set(null);
    }
  }

  private loadYearOverrideForm(yearId: string) {
    const existing = (this.config() as any)?.yearOverrides?.[yearId];
    if (existing) {
      this.yearOverrideForm.set({...existing});
    } else {
      this.yearOverrideForm.set({
        enrollmentOpen: true,
        openFrom: null,
        openUntil: null,
        allowedTypes: ['NEW_ENROLLMENT', 'RE_ENROLLMENT'],
        registrationMode: null,
        welcomeMessage: null
      });
    }
  }

  private loadLevelOverrideForm(levelId: string) {
    const existing = (this.config() as any)?.levelOverrides?.[levelId];
    this.levelOverrideForm.set(existing
      ? JSON.parse(JSON.stringify(existing))
      : {active: true, maxNewEnrollments: null, additionalDocuments: [], assessment: null}
    );
  }

  updateYearOverrideField<K extends keyof YearOverrideConfig>(key: K, value: YearOverrideConfig[K]) {
    this.yearOverrideForm.update(f => ({...f, [key]: value}));
  }

  toggleYearAllowedType(type: 'NEW_ENROLLMENT' | 'RE_ENROLLMENT') {
    const current = this.yearOverrideForm().allowedTypes ?? [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    this.yearOverrideForm.update(f => ({...f, allowedTypes: updated}));
  }

  saveYearOverride() {
    const yearId = this.selectedYearId();
    if (!yearId) return;
    this.isYearOverrideSaving.set(true);
    this.enrollmentService.updateYearOverride(yearId, this.yearOverrideForm())
      .pipe(finalize(() => this.isYearOverrideSaving.set(false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Override année publié.');
          this.loadInitialData();
        }
      });
  }

  deleteYearOverride() {
    const yearId = this.selectedYearId();
    if (!yearId) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer l\'override',
        message: 'L\'année reviendra au comportement ouvert par défaut.',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
        type: 'danger'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.isYearOverrideSaving.set(true);
      this.enrollmentService.deleteYearOverride(yearId)
        .pipe(finalize(() => this.isYearOverrideSaving.set(false)))
        .subscribe({next: () => { this.notificationService.success('Override supprimé.'); this.loadInitialData(); }});
    });
  }

  // --- LEVEL OVERRIDE METHODS ---

  updateLevelOverrideField<K extends keyof LevelOverrideConfig>(key: K, value: LevelOverrideConfig[K]) {
    this.levelOverrideForm.update(f => ({...f, [key]: value}));
  }

  addLevelDoc() {
    this.dialog.open(DocumentTypeFormComponent, {width: '450px', panelClass: 'feewi-dialog-panel'})
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.levelOverrideForm.update(f => ({
          ...f, additionalDocuments: [...(f.additionalDocuments || []), result]
        }));
      });
  }

  removeLevelDoc(code: string) {
    this.levelOverrideForm.update(f => ({
      ...f, additionalDocuments: (f.additionalDocuments || []).filter(d => d.code !== code)
    }));
  }

  updateLevelDocMandatory(code: string, mandatory: boolean) {
    this.levelOverrideForm.update(f => ({
      ...f,
      additionalDocuments: (f.additionalDocuments || []).map(d => d.code === code ? {...d, mandatory} : d)
    }));
  }

  toggleLevelAssessmentOverride() {
    if (this.levelAssessmentEnabled()) {
      this.levelOverrideForm.update(f => ({...f, assessment: null}));
    } else {
      const base = this.config()?.schema?.assessment;
      const fallback = {type: 'DOSSIER' as const, subjects: {}, maxGrade: 20, minPassingGrade: 10};
      this.levelOverrideForm.update(f => ({
        ...f, assessment: base ? JSON.parse(JSON.stringify(base)) : fallback
      }));
    }
  }

  updateLevelAssessmentType(type: any) {
    this.levelOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, type} : null
    }));
  }

  updateLevelMinPassingGrade(grade: number) {
    this.levelOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, minPassingGrade: grade} : null
    }));
  }

  addLevelSubject(input: HTMLInputElement) {
    const val = input.value.trim();
    if (!val || !this.levelOverrideForm().assessment) return;
    this.levelOverrideForm.update(f => ({
      ...f, assessment: {...f.assessment!, subjects: {...f.assessment!.subjects, [val]: 1}}
    }));
    input.value = '';
  }

  updateLevelSubjectCoef(subject: string, coef: number) {
    this.levelOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, subjects: {...f.assessment.subjects, [subject]: coef}} : null
    }));
  }

  removeLevelSubject(subject: string) {
    const subjects = {...this.levelOverrideForm().assessment?.subjects};
    delete subjects[subject];
    this.levelOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, subjects} : null
    }));
  }

  saveLevelOverride() {
    const levelId = this.selectedLevelId();
    if (!levelId) return;
    this.isLevelOverrideSaving.set(true);
    this.enrollmentService.updateLevelOverride(levelId, this.levelOverrideForm())
      .pipe(finalize(() => this.isLevelOverrideSaving.set(false)))
      .subscribe({next: () => { this.notificationService.success('Override niveau publié.'); this.loadInitialData(); }});
  }

  deleteLevelOverride() {
    const levelId = this.selectedLevelId();
    if (!levelId) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer l\'override niveau',
        message: 'Ce niveau reviendra à la configuration globale de l\'école.',
        confirmLabel: 'Supprimer', cancelLabel: 'Annuler', type: 'danger'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.isLevelOverrideSaving.set(true);
      this.enrollmentService.deleteLevelOverride(levelId)
        .pipe(finalize(() => this.isLevelOverrideSaving.set(false)))
        .subscribe({next: () => { this.notificationService.success('Override supprimé.'); this.loadInitialData(); }});
    });
  }

  // --- CYCLE OVERRIDE METHODS ---

  private loadCycleOverrideForm(cycleType: CycleType) {
    const existing = this.config()?.cycleOverrides?.[cycleType];
    this.cycleOverrideForm.set(existing
      ? JSON.parse(JSON.stringify(existing))
      : { assessment: null, additionalDocuments: [], additionalServices: [] }
    );
  }

  saveCycleOverride() {
    const cycleType = this.selectedCycleType();
    if (!cycleType) return;
    this.isCycleOverrideSaving.set(true);
    this.enrollmentService.updateCycleOverride(cycleType, this.cycleOverrideForm())
      .pipe(finalize(() => this.isCycleOverrideSaving.set(false)))
      .subscribe({ next: () => { this.notificationService.success('Override cycle publié.'); this.loadInitialData(); }});
  }

  deleteCycleOverride() {
    const cycleType = this.selectedCycleType();
    if (!cycleType) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer l\'override de cycle',
        message: 'Ce cycle reviendra à la configuration globale de l\'école.',
        confirmLabel: 'Supprimer', cancelLabel: 'Annuler', type: 'danger'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.isCycleOverrideSaving.set(true);
      this.enrollmentService.deleteCycleOverride(cycleType)
        .pipe(finalize(() => this.isCycleOverrideSaving.set(false)))
        .subscribe({ next: () => { this.notificationService.success('Override supprimé.'); this.loadInitialData(); }});
    });
  }

  addCycleDoc() {
    this.dialog.open(DocumentTypeFormComponent, {width: '450px', panelClass: 'feewi-dialog-panel'})
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.cycleOverrideForm.update(f => ({
          ...f, additionalDocuments: [...(f.additionalDocuments || []), result]
        }));
      });
  }

  removeCycleDoc(code: string) {
    this.cycleOverrideForm.update(f => ({
      ...f, additionalDocuments: (f.additionalDocuments || []).filter(d => d.code !== code)
    }));
  }

  updateCycleDocMandatory(code: string, mandatory: boolean) {
    this.cycleOverrideForm.update(f => ({
      ...f,
      additionalDocuments: (f.additionalDocuments || []).map(d => d.code === code ? {...d, mandatory} : d)
    }));
  }

  addCycleService() {
    this.dialog.open(ServiceFormComponent, {width: '500px', panelClass: 'feewi-dialog-panel'})
      .afterClosed().subscribe((result: ServiceConfig | undefined) => {
        if (!result) return;
        this.cycleOverrideForm.update(f => ({
          ...f, additionalServices: [...(f.additionalServices || []), result]
        }));
      });
  }

  removeCycleService(code: string) {
    this.cycleOverrideForm.update(f => ({
      ...f, additionalServices: (f.additionalServices || []).filter(s => s.code !== code)
    }));
  }

  updateCycleServiceMandatory(code: string, mandatory: boolean) {
    this.cycleOverrideForm.update(f => ({
      ...f, additionalServices: (f.additionalServices || []).map(s => s.code === code ? {...s, mandatory} : s)
    }));
  }

  toggleCycleAssessmentOverride() {
    if (this.cycleAssessmentEnabled()) {
      this.cycleOverrideForm.update(f => ({...f, assessment: null}));
    } else {
      const base = this.config()?.schema?.assessment;
      const fallback = {type: 'DOSSIER' as const, subjects: {}, maxGrade: 20, minPassingGrade: 10};
      this.cycleOverrideForm.update(f => ({
        ...f, assessment: base ? JSON.parse(JSON.stringify(base)) : fallback
      }));
    }
  }

  updateCycleAssessmentType(type: any) {
    this.cycleOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, type} : null
    }));
  }

  updateCycleMinPassingGrade(grade: number) {
    this.cycleOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, minPassingGrade: grade} : null
    }));
  }

  addCycleSubject(input: HTMLInputElement) {
    const val = input.value.trim();
    if (!val || !this.cycleOverrideForm().assessment) return;
    this.cycleOverrideForm.update(f => ({
      ...f, assessment: {...f.assessment!, subjects: {...f.assessment!.subjects, [val]: 1}}
    }));
    input.value = '';
  }

  updateCycleSubjectCoef(subject: string, coef: number) {
    this.cycleOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, subjects: {...f.assessment.subjects, [subject]: coef}} : null
    }));
  }

  removeCycleSubject(subject: string) {
    const subjects = {...this.cycleOverrideForm().assessment?.subjects};
    delete subjects[subject];
    this.cycleOverrideForm.update(f => ({
      ...f, assessment: f.assessment ? {...f.assessment, subjects} : null
    }));
  }

  // --- PILLAR METHODS ---

  updateCoreFieldLabel(fieldName: string, label: string) {
    const current = this.config();
    if (!current) return;
    const key = this.activePillarKey();
    const pillar = {...(current.schema as any)[key]};
    const ctrlKey = key === 'family' ? 'guardianCoreFieldControls' : 'coreFieldControls';
    if (!pillar[ctrlKey]) return;
    pillar[ctrlKey] = {...pillar[ctrlKey], [fieldName]: {...pillar[ctrlKey][fieldName], label}};
    this.config.set({...current, schema: {...current.schema, [key]: pillar}});
  }

  togglePillarEnabled(key: string) {
    const current = this.config();
    if (!current || key === 'identity') return;
    const pillar = (current.schema as any)[key];
    this.config.set({...current, schema: {...current.schema, [key]: {...pillar, enabled: !pillar?.enabled}}});
  }

  addCustomField() {
    this.dialog.open(CustomFieldFormComponent, {width: '500px', panelClass: 'feewi-dialog-panel'})
      .afterClosed().subscribe(result => {
        if (!result || !this.config()) return;
        const current = this.config()!;
        const key = this.activePillarKey();
        const pillar = {...(current.schema as any)[key]};
        const cfKey = key === 'family' ? 'guardianCustomFields' : 'customFields';
        pillar[cfKey] = [...(pillar[cfKey] || []), result];
        this.config.set({...current, schema: {...current.schema, [key]: pillar}});
      });
  }

  removeCustomField(fieldName: string) {
    const current = this.config();
    if (!current) return;
    const key = this.activePillarKey();
    const pillar = {...(current.schema as any)[key]};
    const cfKey = key === 'family' ? 'guardianCustomFields' : 'customFields';
    pillar[cfKey] = (pillar[cfKey] || []).filter((f: FieldConfig) => f.name !== fieldName);
    this.config.set({...current, schema: {...current.schema, [key]: pillar}});
  }

  // --- DOCUMENT METHODS ---

  updateDocumentMandatory(code: string, mandatory: boolean) {
    const current = this.config();
    if (!current) return;
    const presetDocuments = current.schema.documents.presetDocuments.map((d: PresetDocumentConfig) =>
      d.code === code ? {...d, mandatory} : d
    );
    this.config.set({...current, schema: {...current.schema, documents: {...current.schema.documents, presetDocuments}}});
  }

  updateDocumentName(code: string, name: string) {
    const current = this.config();
    if (!current) return;
    const presetDocuments = current.schema.documents.presetDocuments.map((d: PresetDocumentConfig) =>
      d.code === code ? {...d, name} : d
    );
    this.config.set({...current, schema: {...current.schema, documents: {...current.schema.documents, presetDocuments}}});
  }

  addDocumentType() {
    this.dialog.open(DocumentTypeFormComponent, {width: '450px', panelClass: 'feewi-dialog-panel'})
      .afterClosed().subscribe(result => {
        if (!result || !this.config()) return;
        const current = this.config()!;
        const presetDocuments = [...current.schema.documents.presetDocuments, result];
        this.config.set({...current, schema: {...current.schema, documents: {...current.schema.documents, presetDocuments}}});
      });
  }

  removeDocumentType(code: string) {
    const current = this.config();
    if (!current) return;
    const presetDocuments = current.schema.documents.presetDocuments.filter((d: PresetDocumentConfig) => d.code !== code);
    this.config.set({...current, schema: {...current.schema, documents: {...current.schema.documents, presetDocuments}}});
  }

  // --- ASSESSMENT METHODS ---

  updateAssessmentType(type: any) {
    const c = this.config();
    if (c?.schema.assessment)
      this.config.set({...c, schema: {...c.schema, assessment: {...c.schema.assessment, type}}});
  }

  updateMinPassingGrade(grade: number) {
    const c = this.config();
    if (c?.schema.assessment)
      this.config.set({...c, schema: {...c.schema, assessment: {...c.schema.assessment, minPassingGrade: grade}}});
  }

  addSubject(input: HTMLInputElement) {
    const val = input.value.trim();
    const c = this.config();
    if (!val || !c?.schema.assessment) return;
    const subjects = {...c.schema.assessment.subjects, [val]: 1};
    this.config.set({...c, schema: {...c.schema, assessment: {...c.schema.assessment, subjects}}});
    input.value = '';
  }

  updateSubjectCoef(subject: string, coef: number) {
    const c = this.config();
    if (!c?.schema.assessment) return;
    const subjects = {...c.schema.assessment.subjects, [subject]: coef};
    this.config.set({...c, schema: {...c.schema, assessment: {...c.schema.assessment, subjects}}});
  }

  removeSubject(subject: string) {
    const c = this.config();
    if (!c?.schema.assessment) return;
    const subjects = {...c.schema.assessment.subjects};
    delete subjects[subject];
    this.config.set({...c, schema: {...c.schema, assessment: {...c.schema.assessment, subjects}}});
  }

  // --- SERVICES METHODS ---

  private patchServices(patch: Partial<ServicesSchemaConfig>) {
    const c = this.config();
    if (!c) return;
    const services = {...(c.schema.services ?? {enabled: false, availableServices: []}), ...patch};
    this.config.set({...c, schema: {...c.schema, services}});
  }

  toggleServicesEnabled() {
    this.patchServices({enabled: !this.servicesEnabled()});
  }

  addService() {
    this.dialog.open(ServiceFormComponent, {width: '500px', panelClass: 'feewi-dialog-panel'})
      .afterClosed().subscribe((result: ServiceConfig | undefined) => {
        if (!result) return;
        this.patchServices({
          availableServices: [...this.activeServices(), result]
        });
      });
  }

  updateServiceMandatory(code: string, mandatory: boolean) {
    this.patchServices({
      availableServices: this.activeServices().map(s => s.code === code ? {...s, mandatory} : s)
    });
  }

  removeService(code: string) {
    this.patchServices({
      availableServices: this.activeServices().filter(s => s.code !== code)
    });
  }

  // --- WORKFLOW METHODS ---

  updateRegistrationMode(mode: string) {
    const c = this.config();
    if (c) this.config.set({...c, registrationMode: mode as any});
  }

  togglePortal() {
    const c = this.config();
    if (!c) return;
    this.enrollmentService.updatePortalStatus(!c.portalActive).subscribe(() => this.loadInitialData());
  }

  previewPortal() {
    this.dialog.open(PortalPreviewDialogComponent, {
      width: '100vw', height: '100vh', data: {config: this.config(), activeYear: this.activeYear()}
    });
  }

  discardChanges() {
    const initial = this.initialConfig();
    if (initial) this.config.set(JSON.parse(JSON.stringify(initial)));
  }

  resetToSystemDefaults() {
    this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Réinitialisation d\'usine',
        message: 'Cette action supprimera toutes vos personnalisations (champs, documents, évaluation) pour restaurer les standards Feewi. Irréversible.',
        confirmLabel: 'Réinitialiser',
        cancelLabel: 'Annuler',
        type: 'danger'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.isLoading.set(true);
      this.enrollmentService.resetConfig()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({next: () => { this.notificationService.success('Configuration réinitialisée.'); this.loadInitialData(); }});
    });
  }

  // --- ICONS ---
  readonly Settings2 = Settings2; readonly Eye = Eye; readonly Save = Save;
  readonly RefreshCw = RefreshCw; readonly Globe = Globe; readonly GraduationCap = GraduationCap;
  readonly ShieldCheck = ShieldCheck; readonly Plus = Plus; readonly Trash2 = Trash2;
  readonly Sparkles = Sparkles; readonly Info = Info; readonly MessageSquare = MessageSquare;
  readonly LayoutGrid = LayoutGrid; readonly Lock = Lock; readonly ClipboardList = ClipboardList;
  readonly HeartPulse = HeartPulse; readonly Users = Users; readonly School = School;
  readonly FileText = FileText; readonly Hash = Hash; readonly ToggleIcon = ToggleIcon;
  readonly AlertTriangle = AlertTriangle; readonly UserCog = UserCog;
  readonly Calendar = Calendar; readonly CalendarClock = CalendarClock; readonly Wrench = Wrench;
}
