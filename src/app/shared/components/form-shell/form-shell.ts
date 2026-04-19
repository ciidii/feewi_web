import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Save } from 'lucide-angular';
import { Component, input, output, HostListener } from '@angular/core';
import { FwButtonComponent } from '../button/button.component';
import { A11yModule } from '@angular/cdk/a11y';

export type FormShellMode = 'page' | 'dialog';

@Component({
  selector: 'app-fw-form-shell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwButtonComponent, A11yModule],
  templateUrl: './form-shell.html',
  styleUrls: ['./form-shell.scss']
})
export class FormShellComponent {
  // --- Configuration ---
  mode = input<FormShellMode>('dialog');
  title = input.required<string>();
  subtitle = input<string>('');
  icon = input<any>();
  statusLabel = input<string>('');

  // --- Actions ---
  saveLabel = input<string>('Enregistrer');
  cancelLabel = input<string>('Annuler');
  isLoading = input<boolean>(false);
  canSave = input<boolean>(true);
  showCancel = input<boolean>(true);

  // --- Outputs ---
  save = output<void>();
  cancel = output<void>();

  // Icons
  readonly X = X;
  readonly Save = Save;

  onSave() {
    if (!this.isLoading() && this.canSave()) {
      this.save.emit();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.mode() === 'dialog') {
      this.onCancel();
    }
  }
}
