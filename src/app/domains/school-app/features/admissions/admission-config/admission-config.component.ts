import { Component, inject, signal, OnInit, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Globe, Save, RefreshCw, Eye,
  Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon,
  ChefHat, Bus, MessageSquare, Plus, Trash2, Settings2,
  GraduationCap, Info, AlertTriangle, LayoutGrid, UserCog, ClipboardCheck, BookOpen, X, Sparkles
} from 'lucide-angular';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { EnrollmentConfig, RequiredDocumentConfig, CoreFieldControl, CustomFieldConfig, LevelOverrideConfig, AssessmentConfig } from '../../../../../core/models/enrollment.model';
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

  isLoading = signal(true);
  isSaving = signal(false);

  currentScope = signal<ConfigScope>('GLOBAL');
  selectedLevelId = signal<string | null>(null);

  // --- CALCULS RÉACTIFS ---

  /** Détermine si des modifications ont été effectuées par rapport à l'état initial */
  isDirty = computed(() => {
    const current = this.config();
    const initial = this.initialConfig();
    if (!current || !initial) return false;
    return JSON.stringify(current) !== JSON.stringify(initial);
  });

  // Liste des champs standards pilotables
  readonly coreFieldsList = [
    { key: 'gender', label: 'Sexe', category: 'Candidat' },
    { key: 'birthPlace', label: 'Lieu de naissance', category: 'Candidat' },
    { key: 'nationality', label: 'Nationalité', category: 'Candidat' },
    { key: 'previousSchool', label: 'École d\'origine', category: 'Candidat' },
    { key: 'address', label: 'Adresse physique', category: 'Tuteur' },
    { key: 'profession', label: 'Profession du tuteur', category: 'Tuteur' }
  ];

  // --- CALCULS RÉACTIFS ---

  activeChecklist = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];
    if (this.currentScope() === 'LEVEL' && this.selectedLevelId()) {
      const override = cfg.levelOverrides?.[this.selectedLevelId()!];
      if (override?.documentChecklist) return override.documentChecklist;
    }
    return cfg.defaultChecklist;
  });

  activeCoreOverrides = computed(() => {
    const cfg = this.config();
    if (!cfg) return {};
    if (this.currentScope() === 'LEVEL' && this.selectedLevelId()) {
      const override = cfg.levelOverrides?.[this.selectedLevelId()!];
      if (override?.coreFieldOverrides) return override.coreFieldOverrides;
    }
    return cfg.defaultCoreOverrides;
  });

  activeCustomFields = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];
    if (this.currentScope() === 'LEVEL' && this.selectedLevelId()) {
      const override = cfg.levelOverrides?.[this.selectedLevelId()!];
      if (override?.formSchema?.customFields) return override.formSchema.customFields;
    }
    return cfg.defaultFormSchema?.customFields || [];
  });

  activeAssessmentConfig = computed(() => {
    const cfg = this.config();
    if (!cfg) return { type: 'DOSSIER', subjects: [], minPassingGrade: 10 } as AssessmentConfig;
    if (this.currentScope() === 'LEVEL' && this.selectedLevelId()) {
      const override = cfg.levelOverrides?.[this.selectedLevelId()!];
      if (override?.assessmentConfig) return override.assessmentConfig;
    }
    return cfg.defaultAssessmentConfig;
  });

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      config: this.enrollmentService.getConfig(),
      year: this.academicService.getCurrentYear(),
      levels: this.academicService.getLevels()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ config, year, levels }) => {
        const securedConfig = this.secureConfig(config);
        if (year) {
          securedConfig.admissionWindow = {
            startDate: year.registrationStartDate || '',
            endDate: year.registrationEndDate || ''
          };
        }
        this.config.set(securedConfig);
        // On clone l'objet pour avoir une référence différente pour la comparaison
        this.initialConfig.set(JSON.parse(JSON.stringify(securedConfig)));
        this.activeYear.set(year);
        this.levels.set(levels);
      },
      error: (err) => console.error('[AdmissionConfig] Erreur initialisation:', err)
    });
  }

  private secureConfig(config: EnrollmentConfig): EnrollmentConfig {
    return {
      ...config,
      defaultChecklist: config.defaultChecklist || [],
      defaultFormSchema: config.defaultFormSchema || { customFields: [] },
      defaultCoreOverrides: config.defaultCoreOverrides || {},
      defaultAssessmentConfig: config.defaultAssessmentConfig ? {
        ...config.defaultAssessmentConfig,
        subjects: config.defaultAssessmentConfig.subjects || []
      } : { type: 'DOSSIER', subjects: [], minPassingGrade: 10 },
      enabledServices: config.enabledServices || [],
      levelOverrides: config.levelOverrides || {},
      instructions: config.instructions || { 'general': '' },
      legalText: config.legalText || '',
      admissionWindow: { startDate: '', endDate: '' }
    };
  }

  onSave() {
    // CHANTIER UX : On force l'ajout de la matière s'il en reste une dans le champ
    if (this.subjectInput?.nativeElement.value.trim()) {
      this.addSubject(this.subjectInput.nativeElement);
    }

    const currentConfig = this.config();
    const year = this.activeYear();
    if (!currentConfig || !year) return;

    this.isSaving.set(true);

    // On n'exclut plus portalActive, on veut envoyer l'état actuel complet
    // On n'exclut que admissionWindow car c'est une propriété helper pour l'UI
    // qui n'existe pas sur le modèle de base du backend
    const { admissionWindow, ...payload } = currentConfig;

    let configOp$: Observable<any>;
    if (this.currentScope() === 'GLOBAL') {
      configOp$ = this.enrollmentService.updateConfig(payload as EnrollmentConfig);
    } else {
      const levelId = this.selectedLevelId()!;
      const override = currentConfig.levelOverrides?.[levelId];
      configOp$ = this.enrollmentService.updateLevelOverride(levelId, override);
    }

    let academicOp$: Observable<any> = of(null);
    if (this.currentScope() === 'GLOBAL' && admissionWindow) {
      const updatedYear: AcademicYear = {
        ...year,
        registrationStartDate: admissionWindow.startDate || undefined,
        registrationEndDate: admissionWindow.endDate || undefined
      };
      academicOp$ = this.academicService.updateYear(year.id, updatedYear);
    }

    forkJoin({ config: configOp$, academic: academicOp$ }).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.notificationService.success('Configuration et calendrier publiés avec succès.');
        // On synchronise le snapshot initial avec le nouvel état sauvegardé
        this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      },
      error: (err) => {
        console.error('[AdmissionConfig] Erreur sauvegarde:', err);
        this.notificationService.error('Erreur lors de la synchronisation.');
      }
    });
  }

  setScope(scope: ConfigScope, levelId: string | null = null) {
    this.currentScope.set(scope);
    this.selectedLevelId.set(levelId);
    window.scrollTo(0, 0); // Reset scroll pour le confort
  }

  /** HELPER UX : Vérifie si une section est personnalisée pour le niveau actuel */
  isSectionOverridden(section: 'DOCS' | 'CORE' | 'FIELDS' | 'ASSESS'): boolean {
    if (this.currentScope() === 'GLOBAL') return false;
    const levelId = this.selectedLevelId();
    if (!levelId) return false;

    const override = this.config()?.levelOverrides?.[levelId];
    if (!override) return false;

    switch (section) {
      case 'DOCS': return !!override.documentChecklist?.length;
      case 'CORE': return !!(override.coreFieldOverrides && Object.keys(override.coreFieldOverrides).length);
      case 'FIELDS': return !!override.formSchema?.customFields?.length;
      case 'ASSESS': return !!override.assessmentConfig;
      default: return false;
    }
  }

  /** ACTION UX : Supprime la surcharge d'une section pour revenir au global */
  resetSectionToGlobal(section: 'DOCS' | 'CORE' | 'FIELDS' | 'ASSESS') {
    const current = this.config();
    const levelId = this.selectedLevelId();
    if (!current || !levelId) return;

    const levelOverrides = { ...current.levelOverrides };
    const override = { ...(levelOverrides[levelId] || this.createEmptyLevelOverride()) };

    switch (section) {
      case 'DOCS': delete override.documentChecklist; break;
      case 'CORE': delete override.coreFieldOverrides; break;
      case 'FIELDS': delete override.formSchema; break;
      case 'ASSESS': delete override.assessmentConfig; break;
    }

    levelOverrides[levelId] = override;
    this.config.set({ ...current, levelOverrides });
    this.notificationService.info('Réglage réinitialisé aux valeurs par défaut de l\'école.');
  }

  // --- GESTION DES CHAMPS STANDARDS (Core Overrides) ---

  getCoreFieldControl(key: string): CoreFieldControl {
    return this.activeCoreOverrides()[key] || { label: '', hidden: false, mandatory: false };
  }

  updateCoreField(key: string, patch: Partial<CoreFieldControl>) {
    const current = this.config();
    if (!current) return;

    const currentControl = this.getCoreFieldControl(key);
    const updatedControl = { ...currentControl, ...patch };

    if (this.currentScope() === 'GLOBAL') {
      const overrides = { ...current.defaultCoreOverrides, [key]: updatedControl };
      this.config.set({ ...current, defaultCoreOverrides: overrides });
    } else {
      const levelId = this.selectedLevelId()!;
      const existingOverride = current.levelOverrides?.[levelId] || this.createEmptyLevelOverride();

      const levelOverride = {
        ...existingOverride,
        coreFieldOverrides: { ...existingOverride.coreFieldOverrides, [key]: updatedControl }
      };

      this.config.set({
        ...current,
        levelOverrides: { ...current.levelOverrides, [levelId]: levelOverride }
      });
    }
  }

  // --- GESTION DE L'ÉVALUATION ---

  updateAssessmentType(type: 'EXAM' | 'DOSSIER' | 'INTERVIEW') {
    this.updateActiveAssessment({ type: type });
  }

  updateMinGrade(grade: number) {
    this.updateActiveAssessment({ minPassingGrade: grade });
  }

  addSubject(subjectInput: HTMLInputElement) {
    const subject = subjectInput.value.trim();
    if (!subject) return;
    const currentSubjects = this.activeAssessmentConfig().subjects || [];
    if (!currentSubjects.includes(subject)) {
      this.updateActiveAssessment({ subjects: [...currentSubjects, subject] });
      subjectInput.value = '';
    }
  }

  removeSubject(subject: string) {
    const updated = (this.activeAssessmentConfig().subjects || []).filter(s => s !== subject);
    this.updateActiveAssessment({ subjects: updated });
  }

  private updateActiveAssessment(patch: Partial<AssessmentConfig>) {
    const current = this.config();
    if (!current) return;
    const updated = { ...this.activeAssessmentConfig(), ...patch };

    if (this.currentScope() === 'GLOBAL') {
      this.config.set({ ...current, defaultAssessmentConfig: updated });
    } else {
      const levelId = this.selectedLevelId()!;
      const existingOverride = current.levelOverrides?.[levelId] || this.createEmptyLevelOverride();

      const levelOverride = {
        ...existingOverride,
        assessmentConfig: updated
      };

      this.config.set({
        ...current,
        levelOverrides: { ...current.levelOverrides, [levelId]: levelOverride }
      });
    }
  }

  // --- GESTION DES DOCUMENTS ---

  addDocumentType() {
    const dialogRef = this.dialog.open(DocumentTypeFormComponent, {
      width: '450px',
      panelClass: 'feewi-dialog-panel'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.updateActiveChecklist([...this.activeChecklist(), result]);
    });
  }

  editDocumentType(doc: RequiredDocumentConfig) {
    const dialogRef = this.dialog.open(DocumentTypeFormComponent, {
      width: '450px',
      panelClass: 'feewi-dialog-panel',
      data: doc
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updated = this.activeChecklist().map(d => d.code === doc.code ? result : d);
        this.updateActiveChecklist(updated);
      }
    });
  }

  removeDocumentType(code: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le document',
        message: 'Êtes-vous sûr de vouloir retirer ce type de document ?',
        confirmLabel: 'Supprimer',
        type: 'danger'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const updated = this.activeChecklist().filter((d: any) => d.code !== code);
        this.updateActiveChecklist(updated);
      }
    });
  }

  updateDocumentMandatory(code: string, mandatory: boolean) {
    const updated = this.activeChecklist().map((doc: RequiredDocumentConfig) =>
      doc.code === code ? { ...doc, mandatory } : doc
    );
    this.updateActiveChecklist(updated);
  }

  private updateActiveChecklist(list: RequiredDocumentConfig[]) {
    const current = this.config();
    if (!current) return;
    if (this.currentScope() === 'GLOBAL') {
      this.config.set({ ...current, defaultChecklist: list });
    } else {
      const levelId = this.selectedLevelId()!;
      const existingOverride = current.levelOverrides?.[levelId] || this.createEmptyLevelOverride();

      const levelOverride = {
        ...existingOverride,
        documentChecklist: list
      };

      this.config.set({
        ...current,
        levelOverrides: { ...current.levelOverrides, [levelId]: levelOverride }
      });
    }
  }

  // --- GESTION DES QUESTIONS PERSONNALISÉES ---

  addCustomField() {
    const dialogRef = this.dialog.open(CustomFieldFormComponent, {
      width: '500px',
      panelClass: 'feewi-dialog-panel'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.updateActiveCustomFields([...this.activeCustomFields(), result]);
    });
  }

  editCustomField(field: CustomFieldConfig) {
    const dialogRef = this.dialog.open(CustomFieldFormComponent, {
      width: '500px',
      panelClass: 'feewi-dialog-panel',
      data: field
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updated = this.activeCustomFields().map(f => f.name === field.name ? result : f);
        this.updateActiveCustomFields(updated);
      }
    });
  }

  removeCustomField(name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la question',
        message: 'Êtes-vous sûr de vouloir retirer cette question du formulaire d\'admission ?',
        confirmLabel: 'Supprimer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const updated = this.activeCustomFields().filter((f: CustomFieldConfig) => f.name !== name);
        this.updateActiveCustomFields(updated);
        this.notificationService.info('Question retirée de la liste.');
      }
    });
  }

  private updateActiveCustomFields(list: CustomFieldConfig[]) {
    const current = this.config();
    if (!current) return;
    if (this.currentScope() === 'GLOBAL') {
      this.config.set({ ...current, defaultFormSchema: { ...current.defaultFormSchema, customFields: list } });
    } else {
      const levelId = this.selectedLevelId()!;
      const existingOverride = current.levelOverrides?.[levelId] || this.createEmptyLevelOverride();

      const levelOverride = {
        ...existingOverride,
        formSchema: { ...existingOverride.formSchema, customFields: list }
      };

      this.config.set({
        ...current,
        levelOverrides: { ...current.levelOverrides, [levelId]: levelOverride }
      });
    }
  }

  // --- ACTIONS DIVERSES ---

  updateAdmissionWindow(patch: Partial<{ startDate: string; endDate: string }>) {
    const current = this.config();
    if (current && current.admissionWindow) {
      this.updateConfigField({
        admissionWindow: { ...current.admissionWindow, ...patch }
      });
    }
  }

  updateInstruction(key: string, value: string) {
    const current = this.config();
    if (current) {
      this.updateConfigField({
        instructions: { ...current.instructions, [key]: value }
      });
    }
  }

  updateLegalText(text: string) {
    this.updateConfigField({ legalText: text });
  }

  /** Mise à jour générique d'un champ de la config pour garantir l'immuabilité et la réactivité */
  updateConfigField(patch: Partial<EnrollmentConfig>) {
    const current = this.config();
    if (current) {
      this.config.set({ ...current, ...patch });
    }
  }

  private createEmptyLevelOverride(): LevelOverrideConfig {
    return {
      documentChecklist: [],
      coreFieldOverrides: {},
      formSchema: { customFields: [] }
    };
  }

  togglePortal() {
    const current = this.config();
    if (!current) return;
    const newStatus = !current.portalActive;
    this.isSaving.set(true);
    this.enrollmentService.updatePortalStatus(newStatus).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.config.set({ ...current, portalActive: newStatus });
        this.notificationService.info(newStatus ? 'Portail public ouvert.' : 'Portail public fermé.');
      }
    });
  }

  isServiceEnabled(code: string): boolean {
    return this.config()?.enabledServices.includes(code) || false;
  }

  toggleService(code: string) {
    const current = this.config();
    if (!current) return;
    const services = [...current.enabledServices];
    const index = services.indexOf(code);
    if (index > -1) services.splice(index, 1);
    else services.push(code);
    this.config.set({ ...current, enabledServices: services });
  }

  previewPortal() {
    this.dialog.open(PortalPreviewDialogComponent, {
      width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh',
      panelClass: 'full-screen-dialog',
      data: { config: this.config(), activeYear: this.activeYear() }
    });
  }

  // Icônes
  readonly Globe = Globe;
  readonly Save = Save;
  readonly RefreshCw = RefreshCw;
  readonly Eye = Eye;
  readonly Calendar = Calendar;
  readonly FileText = FileText;
  readonly ShieldCheck = ShieldCheck;
  readonly ToggleIcon = ToggleIcon;
  readonly ChefHat = ChefHat;
  readonly Bus = Bus;
  readonly MessageSquare = MessageSquare;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Settings2 = Settings2;
  readonly GraduationCap = GraduationCap;
  readonly Info = Info;
  readonly LayoutGrid = LayoutGrid;
  readonly UserCog = UserCog;
  readonly ClipboardCheck = ClipboardCheck;
  protected readonly X = X;
  protected readonly BookOpen = BookOpen;
  protected readonly Sparkles = Sparkles;
}
