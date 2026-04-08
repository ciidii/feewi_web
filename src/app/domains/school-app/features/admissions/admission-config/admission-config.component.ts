import { Component, inject, signal, OnInit, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Globe, Save, RefreshCw, Eye,
  Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon,
  ChefHat, Bus, MessageSquare, Plus, Trash2, Settings2,
  GraduationCap, Info, AlertTriangle, LayoutGrid, UserCog, ClipboardCheck, BookOpen, X, Sparkles,
  HeartPulse, Users, School, Layout, Type, Hash
} from 'lucide-angular';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import {
  EnrollmentConfig,
  RequiredDocumentConfig,
  FieldControl,
  CustomFieldConfig,
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

  // Navigation CMS
  activeTab = signal<ConfigTab>('PILLARS');
  activePillarKey = signal<string>('pillar_identity');

  // --- RÉFÉRENTIELS ---
  readonly systemPillars = [
    { key: 'pillar_identity', label: 'Identité de l\'élève', icon: UserCog, desc: 'État civil, naissance et nationalité.' },
    { key: 'pillar_medical', label: 'Santé & Médical', icon: HeartPulse, desc: 'Groupes sanguins, allergies et urgences.' },
    { key: 'pillar_family', label: 'Famille & Responsables', icon: Users, desc: 'Informations sur les parents et adresse.' },
    { key: 'pillar_schooling', label: 'Vœux & Scolarité', icon: School, desc: 'Orientation, cycles et école d\'origine.' }
  ];

  // --- CALCULS RÉACTIFS ---

  isDirty = computed(() => {
    const current = this.config();
    const initial = this.initialConfig();
    if (!current || !initial) return false;
    return JSON.stringify(current) !== JSON.stringify(initial);
  });

  /** Le pilier actuellement sélectionné pour édition */
  activePillar = computed<PillarConfig | null>(() => {
    const cfg = this.config();
    if (!cfg) return null;
    return cfg.pillars[this.activePillarKey()] || null;
  });

  /** Liste ordonnée des champs système pour le pilier actif */
  activeCoreFields = computed(() => {
    const pillar = this.activePillar();
    if (!pillar || !pillar.coreFields) return [];
    return Object.entries(pillar.coreFields).map(([key, control]) => ({
      key,
      ...control
    }));
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
        this.notificationService.success('Configuration publiée avec succès sur le portail.');
        this.initialConfig.set(JSON.parse(JSON.stringify(updated)));
      },
      error: () => this.notificationService.error('Échec de la synchronisation avec le serveur.')
    });
  }

  // --- GESTION DES PILIERS (LOGIQUE) ---

  setActivePillar(key: string) {
    this.activePillarKey.set(key);
  }

  updateCoreField(fieldKey: string, patch: Partial<FieldControl>) {
    const current = this.config();
    if (!current) return;

    const pillarKey = this.activePillarKey();
    const pillar = { ...current.pillars[pillarKey] };
    if (!pillar.coreFields) pillar.coreFields = {};

    pillar.coreFields[fieldKey] = { ...pillar.coreFields[fieldKey], ...patch };

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

  // --- GESTION DES DOCUMENTS (GLOBAL) ---

  activeChecklist = computed(() => this.config()?.documentChecklist || []);

  updateDocumentMandatory(code: string, mandatory: boolean) {
    const current = this.config();
    if (!current) return;

    const checklist = current.documentChecklist.map(doc =>
      doc.code === code ? { ...doc, mandatory } : doc
    );

    this.config.set({ ...current, documentChecklist: checklist });
  }

  addDocumentType() {
    const dialogRef = this.dialog.open(DocumentTypeFormComponent, {
      width: '450px',
      panelClass: 'feewi-dialog-panel'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const current = this.config();
        if (current) {
          this.config.set({
            ...current,
            documentChecklist: [...current.documentChecklist, result]
          });
        }
      }
    });
  }

  removeDocumentType(code: string) {
    const current = this.config();
    if (!current) return;
    this.config.set({
      ...current,
      documentChecklist: current.documentChecklist.filter(d => d.code !== code)
    });
  }

  // --- ACTIONS DE STATUT ---

  togglePortal() {
    const current = this.config();
    if (!current) return;
    const newStatus = !current.portalActive;
    this.isSaving.set(true);
    this.enrollmentService.updatePortalStatus(newStatus).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.config.set({ ...current, portalActive: newStatus });
        this.notificationService.info(newStatus ? 'Le portail est maintenant ouvert.' : 'Le portail a été fermé.');
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
  readonly ToggleIcon = ToggleIcon;
  protected readonly FileText = FileText;
  protected readonly Calendar = Calendar;
}
