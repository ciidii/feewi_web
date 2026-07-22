import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {
  BookOpen,
  GraduationCap,
  HeartPulse,
  Layers,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  School,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  X
} from 'lucide-angular';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {TenantContextService} from '../../../../../core/services/tenant-context.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, CycleGroup, Filiere, Level} from '../../../../../core/models/academic.model';
import {
  CycleType,
  DirectEntryRequest,
  ExtraPillarConfig,
  FieldConfig,
  LevelConfigResponse
} from '../../../../../core/models/enrollment.model';
import {finalize, forkJoin} from 'rxjs';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';

/** Section de champs personnalisés rendue dynamiquement depuis la config école. */
interface DynamicSection {
  key: string;
  label: string;
  fields: FieldConfig[];
  group: FormGroup;
}

@Component({
  selector: 'app-enrollment-direct-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    RouterModule,
    FwButtonComponent,
    FwPageShellComponent
  ],
  templateUrl: './enrollment-direct-entry.component.html',
  styleUrls: ['./enrollment-direct-entry.component.scss']
})
export class EnrollmentDirectEntryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);
  private tenantContext = inject(TenantContextService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // --- ÉTATS ---
  entryForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  /** Chargement de la config effective déclenché à la sélection d'un niveau. */
  isLoadingConfig = signal(false);
  /** Vrai une fois la config école chargée pour le niveau sélectionné. */
  schemaReady = signal(false);

  // --- RÉFÉRENTIELS ---
  levels = signal<Level[]>([]);
  groupedLevels = signal<CycleGroup[]>([]);
  filieres = signal<Filiere[]>([]);
  activeYear = signal<AcademicYear | null>(null);

  // --- SCHÉMA DYNAMIQUE (config école) ---
  private selectedCycleType = signal<CycleType | undefined>(undefined);
  medicalEnabled = signal(false);

  identityFields = signal<FieldConfig[]>([]);
  medicalFields = signal<FieldConfig[]>([]);
  schoolingFields = signal<FieldConfig[]>([]);
  guardianFields = signal<FieldConfig[]>([]);
  familyFields = signal<FieldConfig[]>([]);
  extraPillars = signal<ExtraPillarConfig[]>([]);

  // FormGroups des customFields (bindés directement dans le template)
  identityCF = signal<FormGroup>(this.fb.group({}));
  medicalCF = signal<FormGroup>(this.fb.group({}));
  schoolingCF = signal<FormGroup>(this.fb.group({}));
  guardianCF = signal<FormGroup>(this.fb.group({}));
  familyCF = signal<FormGroup>(this.fb.group({}));
  private extraCF = signal<Record<string, FormGroup>>({});

  /** Sections de piliers custom pour l'itération dans le template. */
  extraSections = computed<DynamicSection[]>(() =>
    this.extraPillars().map(p => ({key: p.key, label: p.label, fields: (p.customFields ?? []).filter(f => !f.hidden), group: this.extraCF()[p.key] ?? this.fb.group({})}))
  );

  constructor() {
    this.initForm();
  }

  ngOnInit() {
    this.loadData();
  }

  private initForm() {
    this.entryForm = this.fb.group({
      levelId: ['', Validators.required],
      filiereId: [null],
      // Pilier Identité — champs CORE (les customFields sont rendus dynamiquement)
      identity: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        gender: ['', Validators.required],
        birthDate: ['', Validators.required],
        birthPlace: ['', Validators.required]
      }),
      // Pilier Famille — tuteur principal, champs CORE (email inclus : requis à la soumission)
      guardian: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        relation: ['FATHER', Validators.required],
        phone: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        financialResponsible: [true]
      })
    });
  }

  loadData() {
    this.isLoading.set(true);
    forkJoin({
      year: this.academicService.getCurrentYear(),
      levels: this.academicService.getLevels(),
      grouped: this.academicService.getGroupedLevels(),
      filieres: this.academicService.getFilieres()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({year, levels, grouped, filieres}) => {
        this.activeYear.set(year);
        this.levels.set(levels);
        this.groupedLevels.set(grouped);
        this.filieres.set(filieres);
      }
    });
  }

  /** Sélection d'un niveau → résout le cycle puis charge la config effective de l'école. */
  onLevelChange(levelId: string) {
    if (!levelId) {
      this.schemaReady.set(false);
      return;
    }
    this.selectedCycleType.set(this.resolveCycleType(levelId));
    this.loadEffectiveConfig(levelId);
  }

  private resolveCycleType(levelId: string): CycleType | undefined {
    const group = this.groupedLevels().find(g => g.levels.some(l => l.id === levelId));
    return (group?.cycle.code ?? group?.cycle.cycleCode) as CycleType | undefined;
  }

  private loadEffectiveConfig(levelId: string) {
    this.isLoadingConfig.set(true);
    this.schemaReady.set(false);
    this.enrollmentService.getEffectiveConfig(levelId).pipe(
      finalize(() => this.isLoadingConfig.set(false))
    ).subscribe({
      next: (cfg) => this.applySchema(cfg),
      error: () => this.notificationService.error('Impossible de charger le formulaire configuré pour ce niveau.')
    });
  }

  /** Construit les champs dynamiques à partir du schéma renvoyé par la config effective. */
  private applySchema(cfg: LevelConfigResponse) {
    const schema = cfg.schema;
    const visible = (fields?: FieldConfig[]) => (fields ?? []).filter(f => !f.hidden);

    this.identityFields.set(visible(schema.identity?.customFields));
    this.identityCF.set(this.buildGroup(this.identityFields()));

    this.medicalEnabled.set(schema.medical?.enabled !== false);
    this.medicalFields.set(this.medicalEnabled() ? visible(schema.medical?.customFields) : []);
    this.medicalCF.set(this.buildGroup(this.medicalFields()));

    this.schoolingFields.set(visible(schema.schooling?.customFields));
    this.schoolingCF.set(this.buildGroup(this.schoolingFields()));

    this.guardianFields.set(visible(schema.family?.guardianCustomFields));
    this.guardianCF.set(this.buildGroup(this.guardianFields()));

    this.familyFields.set(visible(schema.family?.customFields));
    this.familyCF.set(this.buildGroup(this.familyFields()));

    const extras = (schema.extraPillars ?? []).filter(p => p.enabled);
    this.extraPillars.set(extras);
    const extraGroups: Record<string, FormGroup> = {};
    for (const p of extras) {
      extraGroups[p.key] = this.buildGroup(visible(p.customFields));
    }
    this.extraCF.set(extraGroups);

    this.schemaReady.set(true);
  }

  /** Crée un FormGroup à partir d'une liste de champs configurés (validators mandatory inclus). */
  private buildGroup(fields: FieldConfig[]): FormGroup {
    const group = this.fb.group({});
    for (const f of fields) {
      const initial = f.type === 'BOOLEAN' ? false : '';
      group.addControl(f.name, this.fb.control(initial, f.mandatory ? [Validators.required] : []));
    }
    return group;
  }

  onSave() {
    const dynamicGroups = [this.identityCF(), this.medicalCF(), this.schoolingCF(), this.guardianCF(), this.familyCF(), ...Object.values(this.extraCF())];
    const dynamicInvalid = dynamicGroups.some(g => g.invalid);

    if (this.entryForm.invalid || dynamicInvalid) {
      this.entryForm.markAllAsTouched();
      dynamicGroups.forEach(g => g.markAllAsTouched());
      this.notificationService.warning('Veuillez remplir les champs obligatoires.');
      return;
    }

    const year = this.activeYear();
    if (!year) {
      this.notificationService.warning('Aucune année scolaire active.');
      return;
    }

    this.isSaving.set(true);
    const v = this.entryForm.value;

    const extraPillars: Record<string, Record<string, any>> = {};
    for (const [key, group] of Object.entries(this.extraCF())) {
      extraPillars[key] = group.value;
    }

    const payload: DirectEntryRequest = {
      type: 'NEW_ENROLLMENT',
      academicYearId: year.id,
      levelId: v.levelId,
      filiereId: v.filiereId || null,
      cycleType: this.selectedCycleType(),
      identity: {
        firstName: v.identity.firstName,
        lastName: v.identity.lastName,
        gender: v.identity.gender,
        birthDate: v.identity.birthDate,
        birthPlace: v.identity.birthPlace,
        customFields: this.identityCF().value
      },
      medical: this.medicalEnabled() ? {customFields: this.medicalCF().value} : undefined,
      schoolingCustomFields: this.schoolingCF().value,
      primaryGuardian: {
        firstName: v.guardian.firstName,
        lastName: v.guardian.lastName,
        email: v.guardian.email,
        phone: v.guardian.phone,
        relation: v.guardian.relation,
        financialResponsible: v.guardian.financialResponsible ?? true,
        customFields: this.guardianCF().value
      },
      familyCustomFields: this.familyCF().value,
      extraPillars: Object.keys(extraPillars).length ? extraPillars : undefined
    };

    this.enrollmentService.createDirectApplication(payload).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (res) => {
        this.notificationService.success(`Dossier créé (Réf: ${res.reference})`);
        this.router.navigate(['/admin/admissions', res.id]);
      }
    });
  }

  readonly UserPlus = UserPlus;
  readonly Save = Save;
  readonly X = X;
  readonly RefreshCw = RefreshCw;
  readonly User = User;
  readonly ShieldCheck = ShieldCheck;
  readonly GraduationCap = GraduationCap;
  readonly MapPin = MapPin;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly BookOpen = BookOpen;
  readonly HeartPulse = HeartPulse;
  readonly Layers = Layers;
  protected readonly Users = Users;
  protected readonly School = School;
}
