import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  Quote,
  School as SchoolIcon,
  ShieldCheck,
  User,
  X,
  Flag
} from 'lucide-angular';
import {SchoolService} from '../../../core/services/school.service';
import {NotificationService} from '../../../shared/services/notification.service';

interface WizardStep {
  key: string;
  label: string;
  hint: string;
  icon: any;
  controls: string[];
}

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './tenant-form.component.html',
  styleUrl: './tenant-form.component.scss'
})
export class TenantFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private schoolService = inject(SchoolService);
  private notificationService = inject(NotificationService);

  readonly X = X;
  readonly SchoolIcon = SchoolIcon;
  readonly Globe = Globe;
  readonly Mail = Mail;
  readonly ShieldCheck = ShieldCheck;
  readonly Loader2 = Loader2;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly User = User;
  readonly Lock = Lock;
  readonly Quote = Quote;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Check = Check;
  readonly Flag = Flag;

  isLoading = signal(false);
  error = signal<string | null>(null);
  isIdManuallyEdited = false;

  /** Libellés lisibles des champs, pour signaler précisément ce qui manque à la soumission. */
  private readonly controlLabels: Record<string, string> = {
    name: 'Nom officiel',
    tenantId: "URL d'accès (slug)",
    phone: 'Téléphone',
    educationTemplate: 'Système éducatif',
    allowedCycles: 'Cycles actifs',
    streetAddress: 'Adresse',
    city: 'Ville',
    country: 'Pays',
    email: 'Email institutionnel',
    adminFirstName: 'Prénom administrateur',
    adminLastName: 'Nom administrateur',
    adminStaffType: 'Type de poste',
    adminEmail: 'Email de connexion',
    adminPassword: 'Mot de passe',
    confirmAdminPassword: 'Confirmation du mot de passe'
  };

  // --- État du stepper ---
  currentStep = signal(0);
  readonly steps: WizardStep[] = [
    {key: 'identity', label: 'Identité', hint: 'Nom, URL et contact', icon: SchoolIcon, controls: ['name', 'tenantId', 'phone']},
    {key: 'pedagogy', label: 'Pédagogie', hint: 'Système et cycles', icon: Globe, controls: ['educationTemplate', 'allowedCycles']},
    {key: 'location', label: 'Localisation', hint: 'Adresse et email', icon: MapPin, controls: ['streetAddress', 'city', 'country', 'email']},
    {key: 'admin', label: 'Administrateur', hint: 'Compte racine', icon: ShieldCheck, controls: ['adminFirstName', 'adminLastName', 'adminStaffType', 'adminEmail', 'adminPassword', 'confirmAdminPassword']}
  ];
  readonly isLastStep = computed(() => this.currentStep() === this.steps.length - 1);
  readonly progressPct = computed(() => Math.round(((this.currentStep() + 1) / this.steps.length) * 100));

  tenantForm: FormGroup = this.fb.group({
    tenantId: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    slogan: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{8,}$/)]],
    streetAddress: ['', Validators.required],
    city: ['', Validators.required],
    country: ['Sénégal', Validators.required],
    educationTemplate: ['SN_FR', Validators.required],
    allowedCycles: [[], [Validators.required, Validators.minLength(1)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminFirstName: ['', Validators.required],
    adminLastName: ['', Validators.required],
    adminStaffType: ['ADMINISTRATION', Validators.required],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmAdminPassword: ['', Validators.required]
  }, {validators: this.passwordMatchValidator});

  educationTemplates = [
    {code: 'SN_FR', label: 'Sénégal (Français)'},
    {code: 'GMB_EN', label: 'Gambie (Anglais)'},
    {code: 'GUI_FR', label: 'Guinée (Français)'}
  ];

  staffTypes = [
    {code: 'ADMINISTRATION', label: 'Personnel Administratif'},
    {code: 'TEACHER', label: 'Corps Enseignant'},
    {code: 'SUPPORT', label: 'Personnel Support'},
    {code: 'OTHER', label: 'Autre'}
  ];

  cycleOptions = [
    {code: 'MATERNAL', label: 'Maternelle / Préscolaire'},
    {code: 'PRIMARY', label: 'Primaire / Élémentaire'},
    {code: 'MIDDLE_SCHOOL', label: 'Moyen / Collège'},
    {code: 'HIGH_SCHOOL', label: 'Secondaire / Lycée'}
  ];

  ngOnInit() {
    // Auto-slugification logic
    this.tenantForm.get('name')?.valueChanges.subscribe(name => {
      if (!this.isIdManuallyEdited) {
        const slug = this.slugify(name);
        this.tenantForm.get('tenantId')?.setValue(slug, {emitEvent: false});
      }
    });

    this.tenantForm.get('tenantId')?.valueChanges.subscribe(() => {
      this.isIdManuallyEdited = true;
    });
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('adminPassword');
    const confirm = control.get('confirmAdminPassword');
    if (password && confirm && password.value !== confirm.value) {
      return {passwordMismatch: true};
    }
    return null;
  }

  // --- Navigation stepper ---

  /** Une étape est valide si tous ses contrôles le sont (+ concordance des mots de passe pour l'étape admin). */
  isStepValid(index: number): boolean {
    const step = this.steps[index];
    const controlsOk = step.controls.every(c => !!this.tenantForm.get(c)?.valid);
    if (step.key === 'admin') {
      return controlsOk && !this.tenantForm.hasError('passwordMismatch');
    }
    return controlsOk;
  }

  private markStepTouched(index: number) {
    this.steps[index].controls.forEach(c => this.tenantForm.get(c)?.markAsTouched());
  }

  next() {
    const i = this.currentStep();
    if (!this.isStepValid(i)) {
      this.markStepTouched(i);
      this.notificationService.warning('Complétez cette étape avant de continuer.', 'Étape incomplète');
      return;
    }
    if (i < this.steps.length - 1) {
      this.currentStep.set(i + 1);
    }
  }

  prev() {
    if (this.currentStep() > 0) {
      this.currentStep.update(v => v - 1);
    }
  }

  /** Clic sur l'indicateur : retour libre en arrière, avance seulement si les étapes précédentes sont valides. */
  goToStep(index: number) {
    if (index === this.currentStep()) return;
    if (index < this.currentStep()) {
      this.currentStep.set(index);
      return;
    }
    for (let s = 0; s < index; s++) {
      if (!this.isStepValid(s)) {
        this.currentStep.set(s);
        this.markStepTouched(s);
        return;
      }
    }
    this.currentStep.set(index);
  }

  toggleCycle(code: string) {
    const current = this.tenantForm.get('allowedCycles')?.value as string[];
    const next = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    this.tenantForm.get('allowedCycles')?.setValue(next);
    this.tenantForm.get('allowedCycles')?.markAsTouched();
  }

  isCycleSelected(code: string): boolean {
    return (this.tenantForm.get('allowedCycles')?.value as string[]).includes(code);
  }

  isInvalid(controlName: string): boolean {
    const control = this.tenantForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.tenantForm.get(controlName);
    if (control?.hasError('required')) return 'Ce champ est obligatoire';
    if (control?.hasError('email')) return 'Format email invalide';
    if (control?.hasError('pattern')) return 'Format invalide';
    if (control?.hasError('minlength')) {
      return `Min. ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (this.tenantForm.hasError('passwordMismatch') && controlName === 'confirmAdminPassword') {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }

  close() {
    this.router.navigate(['/saas/tenants']);
  }

  onSubmit() {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();

      // Liste précise des champs à corriger.
      const missing = Object.keys(this.controlLabels)
        .filter(k => this.tenantForm.get(k)?.invalid)
        .map(k => this.controlLabels[k]);
      if (this.tenantForm.hasError('passwordMismatch') && !missing.includes(this.controlLabels['confirmAdminPassword'])) {
        missing.push('Mots de passe non identiques');
      }

      // Positionne l'utilisateur sur la première étape en erreur.
      const firstInvalid = this.steps.findIndex((_, i) => !this.isStepValid(i));
      if (firstInvalid >= 0) this.currentStep.set(firstInvalid);

      const detail = missing.length
        ? `À compléter : ${missing.join(', ')}.`
        : 'Vérifiez les champs du formulaire.';
      this.notificationService.warning(detail, 'Formulaire incomplet');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Filter confirmAdminPassword out of the payload
    const {confirmAdminPassword, ...payload} = this.tenantForm.value;

    this.schoolService.createSchool(payload).subscribe({
      next: () => {
        this.notificationService.success('Etablissement cree avec succes.', 'Creation terminee');
        this.router.navigate(['/saas/tenants']);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || 'Une erreur est survenue lors de la creation.';
        this.error.set(message);
        this.notificationService.error(message, 'Echec de creation');
        this.isLoading.set(false);
      }
    });
  }
}
