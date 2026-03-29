import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, Globe, Save, RefreshCw, Eye, 
  Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon,
  ChefHat, Bus, MessageSquare, Plus, Trash2, Settings2,
  GraduationCap, Info, AlertTriangle
} from 'lucide-angular';
import { finalize, forkJoin, Observable } from 'rxjs';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { EnrollmentConfig, CustomFieldConfig, RequiredDocumentConfig } from '../../../../../core/models/enrollment.model';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AcademicYear, Level } from '../../../../../core/models/academic.model';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { FormShellComponent } from '../../../../../shared/components/form-shell/form-shell';
import { DocumentTypeFormComponent } from './components/document-type-form/document-type-form.component';
import { PortalPreviewComponent } from './components/portal-preview/portal-preview.component';

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
    MatSelectModule,
    FormShellComponent,
    PortalPreviewComponent
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

  // Pilotage du Scope
  currentScope = signal<ConfigScope>('GLOBAL');
  selectedLevelId = signal<string | null>(null);

  // --- CALCULS RÉACTIFS ---

  /**
   * Retourne la checklist des documents en fonction du scope actif
   */
  activeChecklist = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];
    
    if (this.currentScope() === 'LEVEL' && this.selectedLevelId()) {
      const override = cfg.levelOverrides?.[this.selectedLevelId()!];
      if (override?.documentChecklist) return override.documentChecklist;
    }
    
    return cfg.documentChecklist;
  });

  /**
   * Retourne les champs personnalisés en fonction du scope actif
   */
  activeCustomFields = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];
    
    if (this.currentScope() === 'LEVEL' && this.selectedLevelId()) {
      const override = cfg.levelOverrides?.[this.selectedLevelId()!];
      if (override?.formSchema?.customFields) return override.formSchema.customFields;
    }
    
    return cfg.formSchema.customFields;
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
  readonly AlertTriangle = AlertTriangle;

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
        this.config.set(this.secureConfig(config));
        this.activeYear.set(year);
        this.levels.set(levels);
      },
      error: (err) => console.error('[AdmissionConfig] Erreur initialisation:', err)
    });
  }

  private secureConfig(config: EnrollmentConfig): EnrollmentConfig {
    return {
      ...config,
      admissionWindow: config.admissionWindow || { startDate: '', endDate: '' },
      documentChecklist: config.documentChecklist || [],
      formSchema: config.formSchema || { customFields: [] },
      enabledServices: config.enabledServices || [],
      levelOverrides: config.levelOverrides || {}
    };
  }

  onSave() {
    const currentConfig = this.config();
    if (!currentConfig) return;

    this.isSaving.set(true);

    let operation$: Observable<any>;
    if (this.currentScope() === 'GLOBAL') {
      operation$ = this.enrollmentService.updateConfig(currentConfig);
    } else {
      const levelId = this.selectedLevelId()!;
      const override = currentConfig.levelOverrides?.[levelId];
      operation$ = this.enrollmentService.updateLevelOverride(levelId, override);
    }

    operation$.pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => this.notificationService.success('Configuration enregistrée avec succès.'),
      error: (err) => console.error('[AdmissionConfig] Erreur sauvegarde:', err)
    });
  }

  // --- GESTION DU SCOPE ---

  setScope(scope: ConfigScope, levelId: string | null = null) {
    this.currentScope.set(scope);
    this.selectedLevelId.set(levelId);
  }

  // --- ACTIONS DOCUMENTS ---

  addDocumentType() {
    const dialogRef = this.dialog.open(DocumentTypeFormComponent, {
      width: '450px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateActiveChecklist([...this.activeChecklist(), result]);
      }
    });
  }

  removeDocumentType(code: string) {
    const updated = this.activeChecklist().filter((d: any) => d.code !== code);
    this.updateActiveChecklist(updated);
  }

  updateDocumentMandatory(code: string, mandatory: boolean) {
    const updated = this.activeChecklist().map((doc: any) => 
      doc.code === code ? { ...doc, mandatory } : doc
    );
    this.updateActiveChecklist(updated);
  }

  private updateActiveChecklist(list: RequiredDocumentConfig[]) {
    const current = this.config();
    if (!current) return;

    if (this.currentScope() === 'GLOBAL') {
      this.config.set({ ...current, documentChecklist: list });
    } else {
      const levelId = this.selectedLevelId()!;
      const overrides = { ...current.levelOverrides };
      overrides[levelId] = { ...overrides[levelId], documentChecklist: list };
      this.config.set({ ...current, levelOverrides: overrides });
    }
  }

  // --- ACTIONS DIVERSES ---

  togglePortal() {
    const current = this.config();
    if (!current) return;

    const newStatus = !current.isPublicPortalOpen;
    this.isSaving.set(true);

    this.enrollmentService.updatePortalStatus(newStatus).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.config.set({ ...current, isPublicPortalOpen: newStatus });
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
    window.open('/enrollment', '_blank');
  }
}
