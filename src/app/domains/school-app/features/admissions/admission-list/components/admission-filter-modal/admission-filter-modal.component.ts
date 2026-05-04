import {Component, inject, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {Calendar, CheckCircle, Clock, Filter, LucideAngularModule, School, UserCheck, X} from 'lucide-angular';
import {FwButtonComponent} from '../../../../../../../shared/components/button/button.component';
import {FwModalShellComponent} from '../../../../../../../shared/components/modal-shell/modal-shell.component';
import {AcademicYear, CycleGroup} from '../../../../../../../core/models/academic.model';

export interface AdmissionFilterData {
  selectedYear: string;
  selectedLevel: string;
  selectedChannel: string;
  selectedStartDate: string;
  selectedEndDate: string;
  groupedLevels: CycleGroup[];
  years: AcademicYear[];
}

@Component({
  selector: 'app-admission-filter-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    LucideAngularModule,
    FwModalShellComponent,
    FwButtonComponent
  ],
  templateUrl: './admission-filter-modal.component.html',
  styleUrls: ['./admission-filter-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdmissionFilterModalComponent {
  private dialogRef = inject(MatDialogRef<AdmissionFilterModalComponent>);
  data: AdmissionFilterData = inject(MAT_DIALOG_DATA);

  // --- ÉTATS LOCAUX (pour permettre l'annulation) ---
  form = {
    year: this.data.selectedYear,
    level: this.data.selectedLevel,
    channel: this.data.selectedChannel,
    start: this.data.selectedStartDate,
    end: this.data.selectedEndDate
  };

  // Icons
  readonly FilterIcon = Filter;
  readonly XIcon = X;
  readonly ClockIcon = Clock;
  readonly UserCheckIcon = UserCheck;
  readonly CheckCircleIcon = CheckCircle;
  readonly CalendarIcon = Calendar;
  readonly SchoolIcon = School;

  onReset() {
    this.form = { year: '', level: '', channel: '', start: '', end: '' };
  }

  onApply() {
    this.dialogRef.close(this.form);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
