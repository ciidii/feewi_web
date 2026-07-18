import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Loader2, LucideAngularModule, X} from 'lucide-angular';
import {SchoolService} from '../../../core/services/school.service';
import {School} from '../../../core/models/school.model';

@Component({
  selector: 'app-tenant-edit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, LucideAngularModule],
  template: `
    <div class="p-6 w-[min(92vw,520px)]">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-base font-bold text-slate-900">Modifier l'établissement</h2>
        <button type="button" (click)="close()" class="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
          <lucide-icon [name]="X" class="w-4 h-4"></lucide-icon>
        </button>
      </div>

      <form [formGroup]="form" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2 space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom officiel *</label>
          <input type="text" formControlName="name" class="fw-input-clean" [class.error]="invalid('name')"/>
        </div>
        <div class="sm:col-span-2 space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Slogan</label>
          <input type="text" formControlName="slogan" class="fw-input-clean"/>
        </div>
        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email *</label>
          <input type="email" formControlName="email" class="fw-input-clean" [class.error]="invalid('email')"/>
        </div>
        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Téléphone *</label>
          <input type="text" formControlName="phone" class="fw-input-clean" [class.error]="invalid('phone')"/>
        </div>
        <div class="sm:col-span-2 space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adresse *</label>
          <input type="text" formControlName="streetAddress" class="fw-input-clean" [class.error]="invalid('streetAddress')"/>
        </div>
        <div class="sm:col-span-2 space-y-1.5">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ville *</label>
          <input type="text" formControlName="city" class="fw-input-clean" [class.error]="invalid('city')"/>
        </div>
      </form>

      <div class="flex items-center justify-end gap-2 mt-6">
        <button type="button" (click)="close()" class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800">Annuler</button>
        <button type="button" (click)="save()" [disabled]="saving()"
                class="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60">
          <lucide-icon *ngIf="saving()" [name]="Loader2" class="w-4 h-4 animate-spin"></lucide-icon>
          Enregistrer
        </button>
      </div>
    </div>
  `
})
export class TenantEditFormComponent {
  private fb = inject(FormBuilder);
  private schoolService = inject(SchoolService);
  private dialogRef = inject(MatDialogRef<TenantEditFormComponent>);
  data = inject<School>(MAT_DIALOG_DATA);

  readonly X = X;
  readonly Loader2 = Loader2;
  saving = signal(false);

  form = this.fb.group({
    name: [this.data.name, [Validators.required, Validators.minLength(3)]],
    slogan: [this.data.slogan || ''],
    email: [this.data.email, [Validators.required, Validators.email]],
    phone: [this.data.phone, Validators.required],
    streetAddress: [this.data.streetAddress, Validators.required],
    city: [this.data.city, Validators.required]
  });

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.schoolService.updateSchool(this.data.id!, this.form.value as Partial<School>).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false)
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
