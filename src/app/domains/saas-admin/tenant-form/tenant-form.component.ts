import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {
  AlertCircle,
  ArrowLeft,
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
import {FormShellComponent} from '../../../shared/components/form-shell/form-shell';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, FormShellComponent],
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
  readonly Flag = Flag;

  isLoading = signal(false);
  error = signal<string | null>(null);
  isIdManuallyEdited = false;

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
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmAdminPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  educationTemplates = [
    { code: 'SN_FR', label: 'Sénégal (Français)' },
    { code: 'GMB_EN', label: 'Gambie (Anglais)' },
    { code: 'GUI_FR', label: 'Guinée (Français)' }
  ];

  cycleOptions = [
    { code: 'MATERNAL', label: 'Maternelle / Préscolaire' },
    { code: 'PRIMARY', label: 'Primaire / Élémentaire' },
    { code: 'MIDDLE_SCHOOL', label: 'Moyen / Collège' },
    { code: 'HIGH_SCHOOL', label: 'Secondaire / Lycée' }
  ];

  ngOnInit() {
    // Auto-slugification logic
    this.tenantForm.get('name')?.valueChanges.subscribe(name => {
      if (!this.isIdManuallyEdited) {
        const slug = this.slugify(name);
        this.tenantForm.get('tenantId')?.setValue(slug, { emitEvent: false });
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
      .replace(/[\u0300-\u036f]/g, '')
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
      return { passwordMismatch: true };
    }
    return null;
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
      this.notificationService.warning('Verifiez les champs du formulaire.', 'Formulaire incomplet');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Filter confirmAdminPassword out of the payload
    const { confirmAdminPassword, ...payload } = this.tenantForm.value;

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
