import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Building2, Loader2, LucideAngularModule, Mail, MapPin, Phone, Quote, Save, X} from 'lucide-angular';
import {SchoolService} from '../../../core/services/school.service';
import {School} from '../../../core/models/school.model';
import {NotificationService} from '../../../shared/services/notification.service';
import {FormShellComponent} from '../../../shared/components/form-shell/form-shell';

@Component({
  selector: 'app-tenant-edit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule, FormShellComponent],
  templateUrl: './tenant-edit-form.component.html',
  styleUrl: './tenant-edit-form.component.scss'
})
export class TenantEditFormComponent {
  private fb = inject(FormBuilder);
  private schoolService = inject(SchoolService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<TenantEditFormComponent>);
  private data = inject<School>(MAT_DIALOG_DATA);

  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Quote = Quote;
  readonly Loader2 = Loader2;
  readonly X = X;
  readonly Save = Save;

  isLoading = signal(false);

  schoolForm: FormGroup = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.minLength(3)]],
    slogan: [this.data?.slogan ?? ''],
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data?.phone ?? '', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{8,}$/)]],
    streetAddress: [this.data?.streetAddress ?? '', Validators.required],
    city: [this.data?.city ?? '', Validators.required]
  });

  get tenantId(): string {
    return this.data?.tenantId ?? 'N/A';
  }

  isInvalid(controlName: string): boolean {
    const control = this.schoolForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.schoolForm.get(controlName);
    if (control?.hasError('required')) return 'Ce champ est obligatoire';
    if (control?.hasError('email')) return 'Format email invalide';
    if (control?.hasError('pattern')) return 'Format invalide';
    if (control?.hasError('minlength')) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    return 'Champ invalide';
  }

  close() {
    this.dialogRef.close(false);
  }

  onSubmit() {
    if (this.schoolForm.invalid) {
      this.schoolForm.markAllAsTouched();
      this.notificationService.warning('Verifiez les champs du formulaire.', 'Formulaire incomplet');
      return;
    }

    if (!this.data?.id) {
      this.notificationService.error("Impossible de modifier: l'identifiant de l'etablissement est manquant.");
      return;
    }

    this.isLoading.set(true);

    this.schoolService.updateSchool(this.data.id, this.schoolForm.value).subscribe({
      next: () => {
        this.notificationService.success('Etablissement mis a jour avec succes.', 'Modification terminee');
        this.dialogRef.close(true);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        const message = err?.error?.message || err?.message || "Impossible de modifier l'etablissement.";
        this.notificationService.error(message, 'Echec de modification');
        this.isLoading.set(false);
      }
    });
  }
}
