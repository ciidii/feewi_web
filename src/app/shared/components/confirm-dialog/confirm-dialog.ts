import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LucideAngularModule, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-angular';
import { FwModalShellComponent } from '../modal-shell/modal-shell.component';
import { FwButtonComponent } from '../button/button.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'destructive' | 'warning' | 'success' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    LucideAngularModule, 
    FwModalShellComponent, 
    FwButtonComponent
  ],
  templateUrl: './confirm-dialog.html',
  styleUrls: ['./confirm-dialog.scss']
})
export class ConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  getIcon() {
    switch (this.data.type) {
      case 'destructive': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'info': return Info;
      default: return HelpCircle;
    }
  }

  getButtonVariant() {
    if (this.data.type === 'destructive') return 'destructive';
    return 'primary';
  }

  onConfirm() {
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
