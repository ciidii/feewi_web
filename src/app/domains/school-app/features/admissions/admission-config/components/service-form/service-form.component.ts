import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {LucideAngularModule, Plus, Trash2, X} from 'lucide-angular';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ServiceConfig} from '../../../../../../core/models/enrollment.model';
import {labelToCode} from '../../../../../../core/utils/enrollment-utils';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent {
  private dialogRef = inject(MatDialogRef<ServiceFormComponent>);
  data = inject(MAT_DIALOG_DATA);

  label = signal('');
  mandatory = signal(false);
  options = signal<string[]>([]);
  optionInput = '';

  previewCode = () => this.label() ? labelToCode(this.label()) : '—';

  addOption() {
    const val = this.optionInput.trim();
    if (!val || this.options().includes(val)) return;
    this.options.update(o => [...o, val]);
    this.optionInput = '';
  }

  removeOption(opt: string) {
    this.options.update(o => o.filter(x => x !== opt));
  }

  isValid() {
    return this.label().trim().length >= 2;
  }

  submit() {
    if (!this.isValid()) return;
    const result: ServiceConfig = {
      code: labelToCode(this.label()),
      label: this.label().trim(),
      options: this.options(),
      mandatory: this.mandatory(),
      preset: false
    };
    this.dialogRef.close(result);
  }

  cancel() { this.dialogRef.close(); }

  readonly Plus = Plus; readonly Trash2 = Trash2; readonly X = X;
}
