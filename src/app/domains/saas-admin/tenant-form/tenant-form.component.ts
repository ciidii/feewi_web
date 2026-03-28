import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  LucideAngularModule,
  School as SchoolIcon,
  Globe,
  Mail,
  ShieldCheck,
  X,
  Loader2,
  Phone,
  MapPin,
  User,
  Lock,
  Quote,
  CheckCircle2,
  AlertCircle
} from 'lucide-angular';
import { SchoolService } from '../../../core/services/school.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule],
  templateUrl: './tenant-form.component.html',
  styleUrl: './tenant-form.component.scss'
})
export class TenantFormComponent {
  private fb = inject(FormBuilder);
  private schoolService = inject(SchoolService);
  private dialogRef = inject(MatDialogRef<TenantFormComponent>);
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

  isLoading = signal(false);
  error = signal<string | null>(null);

  tenantForm: FormGroup = this.fb.group({
    tenantId: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    slogan: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{8,}$/)]],
    streetAddress: ['', Validators.required],
    city: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminFirstName: ['', Validators.required],
    adminLastName: ['', Validators.required],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  isInvalid(controlName: string): boolean {
    const control = this.tenantForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isValid(controlName: string): boolean {
    const control = this.tenantForm.get(controlName);
    return !!(control && control.valid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.tenantForm.get(controlName);
    if (control?.hasError('required')) return 'Ce champ est obligatoire';
    if (control?.hasError('email')) return 'Format email invalide';
    if (control?.hasError('pattern')) return 'Format invalide';
    if (control?.hasError('minlength')) {
      return `Min. ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  close() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      this.notificationService.warning('Verifiez les champs du formulaire.', 'Formulaire incomplet');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.schoolService.createSchool(this.tenantForm.value).subscribe({
      next: (result) => {
        this.notificationService.success('Tenant cree avec succes.', 'Creation terminee');
        this.dialogRef.close(result);
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
