import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, Globe, Save, RefreshCw, Eye, 
  Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon,
  ChefHat, Bus, MessageSquare, Plus, Trash2, Settings2,
  GraduationCap, Info, AlertTriangle, LayoutGrid, UserCog
} from 'lucide-angular';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { EnrollmentConfig, RequiredDocumentConfig, CoreFieldControl, CustomFieldConfig, LevelOverrideConfig } from '../../../../../core/models/enrollment.model';
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

  // --- ÉTATS ---
  config = signal<EnrollmentConfig | null>(null);
  activeYear = signal<AcademicYear | null>(null);
  levels = signal<Level[]>([]);
  
  isLoading = signal(true);
  isSaving = signal(false);

  currentScope = signal<ConfigScope>('GLOBAL');
  selectedLevelId = signal<string | null>(null);

  // Liste des champs standards pilotables
  readonly coreFieldsList = [
    { key: 'gender', label: 'Sexe / Genre', category: 'Candidat' },
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
      enabledServices: config.enabledServices || [],
      levelOverrides: config.levelOverrides || {},
      instructions: config.instructions || { 'general': '' },
      legalText: config.legalText || '',
      admissionWindow: { startDate: '', endDate: '' }
    };
  }

  onSave() {
    const currentConfig = this.config();
    const year = this.activeYear();
    if (!currentConfig || !year) return;

    this.isSaving.set(true);
    const { admissionWindow, portalActive, ...payload } = currentConfig;

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
      next: () => this.notificationService.success('Configuration et calendrier publiés avec succès.'),
      error: (err) => {
        console.error('[AdmissionConfig] Erreur sauvegarde:', err);
        this.notificationService.error('Erreur lors de la synchronisation.');
      }
    });
  }

  setScope(scope: ConfigScope, levelId: string | null = null) {
    this.currentScope.set(scope);
    this.selectedLevelId.set(levelId);
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
      const levelOverrides = { ...current.levelOverrides };
      const levelOverride = levelOverrides[levelId] || { documentChecklist: [], coreFieldOverrides: {}, formSchema: { customFields: [] } };
      levelOverride.coreFieldOverrides = { ...levelOverride.coreFieldOverrides, [key]: updatedControl };
      levelOverrides[levelId] = levelOverride;
      this.config.set({ ...current, levelOverrides });
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

  private updateActiveChecklist(list: any[]) {
    const current = this.config();
    if (!current) return;
    if (this.currentScope() === 'GLOBAL') {
      this.config.set({ ...current, defaultChecklist: list });
    } else {
      const levelId = this.selectedLevelId()!;
      const overrides = { ...current.levelOverrides };
      const levelOverride = overrides[levelId] || { documentChecklist: [], coreFieldOverrides: {}, formSchema: { customFields: [] } };
      levelOverride.documentChecklist = list;
      overrides[levelId] = levelOverride;
      this.config.set({ ...current, levelOverrides: overrides });
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

  removeCustomField(name: string) {
    const updated = this.activeCustomFields().filter((f: CustomFieldConfig) => f.name !== name);
    this.updateActiveCustomFields(updated);
  }

  private updateActiveCustomFields(list: CustomFieldConfig[]) {
    const current = this.config();
    if (!current) return;
    if (this.currentScope() === 'GLOBAL') {
      this.config.set({ ...current, defaultFormSchema: { ...current.defaultFormSchema, customFields: list } });
    } else {
      const levelId = this.selectedLevelId()!;
      const overrides = { ...current.levelOverrides };
      const levelOverride = overrides[levelId] || { documentChecklist: [], coreFieldOverrides: {}, formSchema: { customFields: [] } };
      levelOverride.formSchema = { ...levelOverride.formSchema, customFields: list };
      overrides[levelId] = levelOverride;
      this.config.set({ ...current, levelOverrides: overrides });
    }
  }

  // --- ACTIONS DIVERSES ---

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
}
