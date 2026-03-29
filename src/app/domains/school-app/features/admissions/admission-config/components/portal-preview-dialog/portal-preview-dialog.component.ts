import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X, Monitor, Smartphone, Tablet } from 'lucide-angular';
import { PortalPreviewComponent } from '../portal-preview/portal-preview.component';
import { EnrollmentConfig } from '../../../../../../../core/models/enrollment.model';
import { AcademicYear } from '../../../../../../../core/models/academic.model';
import { signal } from '@angular/core';

@Component({
  selector: 'app-portal-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, LucideAngularModule, PortalPreviewComponent],
  template: `
    <div class="preview-dialog-container">
      <header class="preview-header">
        <div class="flex items-center gap-4">
          <div class="icon-box bg-slate-800 text-white p-2 rounded-lg">
            <lucide-icon [name]="Monitor" class="w-5 h-5"></lucide-icon>
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">Simulateur d'Expérience Parent</h2>
            <p class="text-xs text-slate-400">Visualisez le portail tel qu'il apparaîtra pour vos usagers.</p>
          </div>
        </div>

        <div class="flex items-center gap-2 ml-auto mr-8">
          <button (click)="viewMode.set('desktop')" [class.active]="viewMode() === 'desktop'" class="view-btn">
            <lucide-icon [name]="Monitor" class="w-4 h-4"></lucide-icon>
          </button>
          <button (click)="viewMode.set('tablet')" [class.active]="viewMode() === 'tablet'" class="view-btn">
            <lucide-icon [name]="Tablet" class="w-4 h-4"></lucide-icon>
          </button>
          <button (click)="viewMode.set('mobile')" [class.active]="viewMode() === 'mobile'" class="view-btn">
            <lucide-icon [name]="Smartphone" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <button (click)="close()" class="close-btn">
          <lucide-icon [name]="X" class="w-5 h-5"></lucide-icon>
        </button>
      </header>

      <main class="preview-body bg-slate-900 flex items-center justify-center p-8">
        <div class="device-mockup" [class]="viewMode()">
          <app-portal-preview [config]="data.config" [activeYear]="data.activeYear"></app-portal-preview>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .preview-dialog-container { display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; }
    .preview-header { height: 72px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; align-items: center; padding: 0 2rem; shrink: 0; }
    .preview-body { flex: 1; overflow: auto; }
    
    .device-mockup { background: white; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; }
    .device-mockup.desktop { width: 1200px; height: 800px; border-radius: 12px; }
    .device-mockup.tablet { width: 768px; height: 1024px; border-radius: 32px; border: 12px solid #1e293b; }
    .device-mockup.mobile { width: 375px; height: 812px; border-radius: 48px; border: 12px solid #1e293b; }

    .view-btn { padding: 8px; border-radius: 8px; border: 1px solid #334155; background: transparent; color: #94a3b8; cursor: pointer; }
    .view-btn.active { background: #2563eb; color: white; border-color: #2563eb; }
    .close-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: #1e293b; color: #94a3b8; cursor: pointer; display: grid; place-items: center; }
    .close-btn:hover { background: #334155; color: white; }
  `]
})
export class PortalPreviewDialogComponent {
  data: { config: EnrollmentConfig, activeYear: AcademicYear | null } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PortalPreviewDialogComponent>);
  
  viewMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');

  readonly Monitor = Monitor;
  readonly Tablet = Tablet;
  readonly Smartphone = Smartphone;
  readonly X = X;

  close() {
    this.dialogRef.close();
  }
}
