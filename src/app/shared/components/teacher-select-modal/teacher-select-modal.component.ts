import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {LucideAngularModule, Search, UserCheck, X} from 'lucide-angular';
import {FwButtonComponent} from '../button/button.component';
import {FwModalShellComponent} from '../modal-shell/modal-shell.component';
import {User} from '../../../core/models/user.model';

export interface TeacherSelectData {
  title: string;
  teachers: User[];
  currentTeacherId?: string;
}

@Component({
  selector: 'app-teacher-select-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    LucideAngularModule,
    FwModalShellComponent,
    FwButtonComponent
  ],
  template: `
    <app-fw-modal-shell
      [title]="data.title"
      subtitle="Sélectionnez l'enseignant responsable pour ce cours."
      [icon]="UserCheckIcon"
      (close)="onCancel()"
    >
      <div class="p-6 flex flex-col gap-6 h-[500px]">
        <!-- Recherche -->
        <div class="relative group">
          <lucide-icon [name]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-primary transition-colors"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Rechercher par nom..."
            class="w-full h-11 pl-11 pr-4 bg-surface-sunken border border-border rounded-xl text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>

        <!-- Liste -->
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div class="grid grid-cols-1 gap-2">
            <button
              *ngFor="let teacher of filteredTeachers()"
              (click)="onSelect(teacher)"
              class="flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all group"
              [class.border-primary]="data.currentTeacherId === teacher.id"
              [class.bg-primary-alpha]="data.currentTeacherId === teacher.id"
              [class.border-transparent]="data.currentTeacherId !== teacher.id"
              [class.hover:bg-surface-sunken]="data.currentTeacherId !== teacher.id"
            >
              <div class="w-10 h-10 rounded-full bg-midnight text-white flex items-center justify-center font-bold text-sm shrink-0">
                {{ teacher.firstName[0] }}{{ teacher.lastName[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-midnight truncate">{{ teacher.firstName }} {{ teacher.lastName }}</p>
                <p class="text-[10px] text-text-tertiary uppercase font-medium tracking-wider">{{ teacher.email }}</p>
              </div>
              <div *ngIf="data.currentTeacherId === teacher.id" class="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                 <lucide-icon [name]="UserCheckIcon" [size]="14"></lucide-icon>
              </div>
            </button>

            <div *ngIf="filteredTeachers().length === 0" class="py-12 text-center">
              <p class="text-xs text-text-tertiary italic">Aucun enseignant trouvé.</p>
            </div>
          </div>
        </div>
      </div>

      <div footer class="flex justify-end p-6 border-t border-border bg-surface-sunken">
        <app-fw-button variant="ghost" size="md" (click)="onCancel()">Annuler</app-fw-button>
      </div>
    </app-fw-modal-shell>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--fw-border-strong); border-radius: 10px; }
  `]
})
export class TeacherSelectModalComponent {
  private dialogRef = inject(MatDialogRef<TeacherSelectModalComponent>);
  data: TeacherSelectData = inject(MAT_DIALOG_DATA);

  searchQuery = '';
  readonly SearchIcon = Search;
  readonly UserCheckIcon = UserCheck;

  filteredTeachers() {
    const q = this.searchQuery.toLowerCase();
    return this.data.teachers.filter(t =>
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    );
  }

  onSelect(teacher: User) {
    this.dialogRef.close(teacher.id);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
