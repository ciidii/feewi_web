import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, MessageSquare, Type, Info, Plus, Trash2, List, Eye, Settings, HelpCircle, X } from 'lucide-angular';
import { FormShellComponent } from '../../../../../../../shared/components/form-shell/form-shell';
import { FieldConfig } from '../../../../../../../core/models/enrollment.model';
import { FwTabsComponent, FwTab } from '../../../../../../../shared/components/tabs/tabs.component';
import { signal } from '@angular/core';

@Component({
  selector: 'app-custom-field-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    LucideAngularModule,
    FormShellComponent,
    FwTabsComponent,
    FormsModule
  ],
  templateUrl: './custom-field-form.component.html',
  styleUrls: ['./custom-field-form.component.scss']
})
export class CustomFieldFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CustomFieldFormComponent>);

  readonly MessageSquare = MessageSquare;
  readonly Type = Type;
  readonly Info = Info;
  readonly Eye = Eye;
  readonly Settings = Settings;
  readonly HelpCircle = HelpCircle;
  readonly X = X;

  // --- NAVIGATION PAR ONGLETS ---
  activeTab = signal<string>('basic');
  readonly formTabs: FwTab[] = [
    { id: 'basic', label: 'Question', icon: MessageSquare },
    { id: 'options', label: 'Options & Aide', icon: Settings },
    { id: 'preview', label: 'Aperçu Direct', icon: Eye }
  ];

  fieldForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(3)]],
    type: ['TEXT', Validators.required],
    mandatory: [false],
    placeholder: [''],
    options: [[]] // Tableau de chaînes pour SELECT
  });

  optionInput = '';

  onTabChange(tabId: string) {
    this.activeTab.set(tabId);
  }

  addOption() {
    const val = this.optionInput.trim();
    if (!val) return;
    const current = this.fieldForm.get('options')?.value || [];
    if (current.includes(val)) return;
    this.fieldForm.patchValue({ options: [...current, val] });
    this.optionInput = '';
  }

  removeOption(opt: string) {
    const current = this.fieldForm.get('options')?.value || [];
    this.fieldForm.patchValue({ options: current.filter((x: string) => x !== opt) });
  }

  onSave() {
    if (this.fieldForm.valid) {
      const formValue = this.fieldForm.value;
      const generatedName = this.generateFieldName(formValue.label);

      const result: FieldConfig = {
        name: generatedName,
        label: formValue.label,
        type: formValue.type,
        mandatory: formValue.mandatory,
        placeholder: formValue.placeholder || undefined,
        options: formValue.type === 'SELECT' ? formValue.options : undefined
      };

      this.dialogRef.close(result);
    } else {
      this.fieldForm.markAllAsTouched();
    }
  }

  private generateFieldName(label: string): string {
    return 'custom_' + label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 20);
  }

  onCancel() {
    this.dialogRef.close();
  }

  isInvalid(controlName: string): boolean {
    const control = this.fieldForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  protected readonly Trash2 = Trash2;
  protected readonly Plus = Plus;
}
