import {Component, computed, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  AlertTriangle,
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
  Users
} from 'lucide-angular';
import {finalize, forkJoin, Observable} from 'rxjs';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {EnrollmentConfig, FieldConfig, LevelOverrideConfig, PresetDocumentConfig} from '../../../../../core/models/enrollment.model';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {AcademicYear, Level} from '../../../../../core/models/academic.model';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DocumentTypeFormComponent} from './components/document-type-form/document-type-form.component';
import {CustomFieldFormComponent} from './components/custom-field-form/custom-field-form.component';
import {PortalPreviewDialogComponent} from './components/portal-preview-dialog/portal-preview-dialog.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';

export type ConfigTab = 'PILLARS' | 'DOCUMENTS' | 'ASSESSMENT' | 'WORKFLOW';
export type ConfigScope = 'GLOBAL' | 'LEVEL';

@Component({
  selector: 'app-admission-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MatDialogModule],
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
  availableYears = signal<AcademicYear[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  currentScope = signal<ConfigScope>('GLOBAL');
  selectedLevelId = signal<string | null>(null);
  activeTab = signal<ConfigTab>('PILLARS');
  activePillarKey = signal<string>('identity');

  // --- STATIC DATA ---
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
    {value: 'PARENT_ONLY', label: 'Portail parents', desc: 'Inscription en ligne uniquement',  icon: Users},
    {value: 'ADMIN_ONLY',  label: 'Guichet seul',    desc: 'Saisie directe par le secrétariat', icon: UserCog},
    {value: 'BOTH',        label: 'Mode mixte',      desc: 'Portail et guichet activés',         icon: Globe}
  ];

  // --- COMPUTED ---
  selectedLevelName = computed(() => {
    const id = this.selectedLevelId();
    return id ? (this.levels().find(l => l.id === id)?.name || id) : '';
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

  /** Core field labels: coreFieldControls for identity/medical/schooling, guardianCoreFieldControls for family */
  activePillarCoreFields = computed<{name: string; label: string}[]>(() => {
    const pillar = this.activePillar();
    if (!pillar) return [];
    const controls = this.activePillarKey() === 'family'
      ? pillar.guardianCoreFieldControls
      : pillar.coreFieldControls;
    if (!controls) return [];
    return Object.entries(controls as Record<string, any>).map(([name, ctrl]) => ({name, label: ctrl.label as string}));
  });

  /** Custom fields: customFields for most pillars, guardianCustomFields for family */
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
      levels: this.academicService.getLevels()
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: ({config, activeYear, allYears, levels}) => {
        if (!config.schema.assessment)
          config.schema.assessment = {type: 'DOSSIER', subjects: {}, maxGrade: 20, minPassingGrade: 10};
        if (!config.schema.documents.presetDocuments)
          config.schema.documents.presetDocuments = [];
        this.config.set(config);
        this.initialConfig.set(JSON.parse(JSON.stringify(config)));
        this.activeYear.set(activeYear);
        this.availableYears.set(allYears);
        this.levels.set(levels);
      },
      error: (err) => console.error('[AdmissionConfig]', err)
    });
  }

  onSave() {
    const cfg = this.config();
    if (!cfg) return;
    this.isSaving.set(true);
    let obs$: Observable<any>;

    if (this.currentScope() === 'GLOBAL') {
      obs$ = this.enrollmentService.updateConfig(cfg);
    } else {
      const override: LevelOverrideConfig = {active: true, assessmentConfig: cfg.schema.assessment};
      obs$ = this.enrollmentService.updateLevelOverride(this.selectedLevelId()!, override);
    }

    obs$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.notificationService.success('Configuration publiée.');
        this.initialConfig.set(JSON.parse(JSON.stringify(cfg)));
      }
    });
  }

  setScope(scope: ConfigScope, levelId: string | null = null) {
    this.currentScope.set(scope);
    this.selectedLevelId.set(levelId);
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
}
