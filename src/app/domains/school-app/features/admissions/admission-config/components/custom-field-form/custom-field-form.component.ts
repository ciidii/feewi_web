import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
  private data: { field: FieldConfig } | null = inject(MAT_DIALOG_DATA, { optional: true });

  get isEditMode(): boolean { return !!this.data?.field; }
  get dialogTitle(): string { return this.isEditMode ? 'Modifier le Champ' : 'Nouveau Champ Personnalisé'; }
  get dialogSubtitle(): string { return this.isEditMode ? 'Modifiez les propriétés de ce champ personnalisé.' : 'Créez une question spécifique à votre établissement.'; }
  get dialogSaveLabel(): string { return this.isEditMode ? 'Enregistrer' : 'Valider et Créer'; }

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
    label:       [this.data?.field?.label       ?? '',     [Validators.required, Validators.minLength(3)]],
    type:        [this.data?.field?.type        ?? 'TEXT', Validators.required],
    mandatory:   [this.data?.field?.mandatory   ?? false],
    hidden:      [this.data?.field?.hidden      ?? false],
    placeholder: [this.data?.field?.placeholder ?? ''],
    options:     [this.data?.field?.options     ?? []]
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
      const v = this.fieldForm.value;
      const result: FieldConfig = {
        name:        this.isEditMode ? this.data!.field.name : this.generateFieldName(v.label),
        label:       v.label,
        type:        v.type,
        mandatory:   v.mandatory,
        hidden:      v.hidden || undefined,
        preset:      this.isEditMode ? this.data!.field.preset : undefined,
        placeholder: v.placeholder || undefined,
        options:     v.type === 'SELECT' ? v.options : undefined
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
