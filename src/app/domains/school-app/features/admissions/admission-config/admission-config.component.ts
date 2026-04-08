import { Component, inject, signal, OnInit, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Globe, Save, RefreshCw, Eye,
  Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon,
  ChefHat, Bus, MessageSquare, Plus, Trash2, Settings2,
  GraduationCap, Info, AlertTriangle, LayoutGrid, UserCog, ClipboardCheck, BookOpen, X, Sparkles,
  HeartPulse, Users, School, Layout, Type, Hash, Lock
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

export type ConfigTab = 'PILLARS' | 'DOCUMENTS' | 'WORKFLOW';

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

  activeTab = signal<ConfigTab>('PILLARS');
  activePillarKey = signal<string>('pillar_identity');

  readonly systemPillars = [
    { key: 'pillar_identity', label: 'Identité de l\'élève', icon: UserCog, desc: 'État civil et informations de base.' },
    { key: 'pillar_medical', label: 'Santé & Médical', icon: HeartPulse, desc: 'Données vitales et urgences.' },
    { key: 'pillar_family', label: 'Famille & Responsables', icon: Users, desc: 'Parents et adresse de résidence.' },
    { key: 'pillar_schooling', label: 'Vœux & Scolarité', icon: School, desc: 'Orientation et parcours scolaire.' }
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

  /** Checklist active pour le template HTML (V4) */
  activeChecklist = computed(() => this.config()?.documentChecklist || []);

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
        this.config.set(config);
        this.initialConfig.set(JSON.parse(JSON.stringify(config)));
        this.activeYear.set(year);
        this.levels.set(levels);
      },
      error: (err) => console.error('[AdmissionConfig] Erreur initialisation:', err)
    });
  }

  onSave() {
    const currentConfig = this.config();
    if (!currentConfig) return;

    this.isSaving.set(true);
    this.enrollmentService.updateConfig(currentConfig).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (updated) => {
        this.notificationService.success('Configuration publiée.');
        this.initialConfig.set(JSON.parse(JSON.stringify(updated)));
      },
      error: () => this.notificationService.error('Erreur de sauvegarde.')
    });
  }

  setActivePillar(key: string) {
    this.activePillarKey.set(key);
  }

  updateSystemField(fieldName: string, patch: Partial<FieldConfig>) {
    const current = this.config();
    if (!current) return;

    const pillarKey = this.activePillarKey();
    const pillar = { ...current.pillars[pillarKey] };
    pillar.systemFields = pillar.systemFields.map(f => 
      f.name === fieldName ? { ...f, ...patch } : f
    );

    this.config.set({
      ...current,
      pillars: { ...current.pillars, [pillarKey]: pillar }
    });
  }

  addCustomField() {
    const dialogRef = this.dialog.open(CustomFieldFormComponent, {
      width: '500px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const current = this.config();
        if (!current) return;

        const pillarKey = this.activePillarKey();
        const pillar = { ...current.pillars[pillarKey] };
        pillar.customFields = [...pillar.customFields, result];

        this.config.set({
          ...current,
          pillars: { ...current.pillars, [pillarKey]: pillar }
        });
      }
    });
  }

  removeCustomField(fieldName: string) {
    const current = this.config();
    if (!current) return;

    const pillarKey = this.activePillarKey();
    const pillar = { ...current.pillars[pillarKey] };
    pillar.customFields = pillar.customFields.filter(f => f.name !== fieldName);

    this.config.set({
      ...current,
      pillars: { ...current.pillars, [pillarKey]: pillar }
    });
  }

  updateDocumentMandatory(code: string, mandatory: boolean) {
    const current = this.config();
    if (!current) return;
    const checklist = current.documentChecklist.map(doc => 
      doc.code === code ? { ...doc, mandatory } : doc
    );
    this.config.set({ ...current, documentChecklist: checklist });
  }

  addDocumentType() {
    const dialogRef = this.dialog.open(DocumentTypeFormComponent, { width: '450px', panelClass: 'feewi-dialog-panel' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const current = this.config();
        if (current) this.config.set({ ...current, documentChecklist: [...current.documentChecklist, result] });
      }
    });
  }

  removeDocumentType(code: string) {
    const current = this.config();
    if (!current) return;
    this.config.set({ ...current, documentChecklist: current.documentChecklist.filter(d => d.code !== code) });
  }

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
          this.notificationService.success('Standards restaurés.');
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
  readonly ToggleIcon = ToggleIcon;
  readonly HeartPulse = HeartPulse;
  readonly Users = Users;
  readonly School = School;
  readonly Lock = Lock;
  protected readonly FileText = FileText;
  protected readonly Calendar = Calendar;
}
