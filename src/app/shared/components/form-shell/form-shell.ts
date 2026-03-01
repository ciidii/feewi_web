import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Loader2, Save } from 'lucide-angular';
import {Component, input, output} from '@angular/core';

@Component({
  selector: 'app-form-shell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './form-shell.html',
  styleUrls: ['./form-shell.scss']
})
export class FormShellComponent {
  // --- Inputs de contenu ---
  title = input.required<string>();
  subtitle = input<string>('');
  icon = input<any>();
  statusLabel = input<string>('');

  // --- Inputs d'état ---
  saveLabel = input<string>('Enregistrer');
  cancelLabel = input<string>('Annuler');
  isLoading = input<boolean>(false);
  canSave = input<boolean>(true);

  // --- Outputs ---
  save = output<void>();
  cancel = output<void>();

  // Icons
  readonly X = X;
  readonly Loader2 = Loader2;
  readonly Save = Save;

  onSave() {
    if (!this.isLoading() && this.canSave()) {
      this.save.emit();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
