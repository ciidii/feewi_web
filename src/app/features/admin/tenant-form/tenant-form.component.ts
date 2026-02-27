import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideAngularModule, School, Globe, Mail, ShieldCheck, X, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    LucideAngularModule
  ],
  templateUrl: './tenant-form.component.html',
  styleUrl: './tenant-form.component.scss'
})
export class TenantFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TenantFormComponent>);

  readonly X = X;
  readonly School = School;
  readonly Globe = Globe;
  readonly Mail = Mail;
  readonly ShieldCheck = ShieldCheck;
  readonly Loader2 = Loader2;

  isLoading = signal(false);

  licenses = [
    { id: 'trial', label: 'Essai (30j)' },
    { id: 'premium', label: 'Premium' },
    { id: 'enterprise', label: 'Enterprise' }
  ];

  tenantForm = this.fb.group({
    name: ['', Validators.required],
    subdomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    licenseType: ['trial', Validators.required]
  });

  close() {
    this.dialogRef.close();
  }

  async onSubmit() {
    if (this.tenantForm.invalid) return;
    
    this.isLoading.set(true);
    // Simulation d'appel API
    setTimeout(() => {
      this.isLoading.set(false);
      this.dialogRef.close(this.tenantForm.value);
    }, 1500);
  }
}
