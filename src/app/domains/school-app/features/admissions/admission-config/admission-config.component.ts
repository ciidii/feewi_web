import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, Globe, Save, RefreshCw, Eye, 
  Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon,
  ChefHat, Bus, MessageSquare, Plus, Trash2
} from 'lucide-angular';
import { finalize, forkJoin } from 'rxjs';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { EnrollmentConfig } from '../../../../../core/models/enrollment.model';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AcademicYear } from '../../../../../core/models/academic.model';

import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-admission-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MatCheckboxModule],
  templateUrl: './admission-config.component.html',
  styleUrls: ['./admission-config.component.scss']
})
export class AdmissionConfigComponent implements OnInit {
  private enrollmentService = inject(EnrollmentAdminService);
  private academicService = inject(AcademicService);
  private notificationService = inject(NotificationService);

  // --- ÉTATS ---
  config = signal<EnrollmentConfig | null>(null);
  activeYear = signal<AcademicYear | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);

  // Icônes
  readonly Globe = Globe;
  readonly Save = Save;
  readonly RefreshCw = RefreshCw;
  readonly Eye = Eye;
  readonly Calendar = Calendar;
  readonly FileText = FileText;
  readonly ShieldCheck = ShieldCheck;
  readonly ToggleIcon = ToggleIcon;
  readonly ChefHat = ChefHat;
  readonly Bus = Bus;
  readonly MessageSquare = MessageSquare;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading.set(true);
    forkJoin({
      config: this.enrollmentService.getConfig(),
      year: this.academicService.getCurrentYear()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ config, year }) => {
        // Aligner les données reçues avec la nouvelle interface
        const securedConfig: EnrollmentConfig = {
          ...config,
          admissionWindow: config.admissionWindow || { startDate: '', endDate: '' },
          documentChecklist: config.documentChecklist || [],
          formSchema: config.formSchema || { customFields: [] },
          enabledServices: config.enabledServices || []
        };
        this.config.set(securedConfig);
        this.activeYear.set(year);
      },
      error: (err) => console.error('[AdmissionConfig] Erreur initialisation:', err)
    });
  }

  onSave() {
    const currentConfig = this.config();
    if (!currentConfig) return;

    // Validation des dates
    if (currentConfig.admissionWindow?.startDate && currentConfig.admissionWindow?.endDate) {
      if (new Date(currentConfig.admissionWindow.startDate) > new Date(currentConfig.admissionWindow.endDate)) {
        this.notificationService.error('La date de début ne peut pas être après la date de fin.');
        return;
      }
    }

    this.isSaving.set(true);
    this.enrollmentService.updateConfig(currentConfig).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => this.notificationService.success('Configuration enregistrée avec succès.'),
      error: (err) => console.error('[AdmissionConfig] Erreur sauvegarde:', err)
    });
  }

  togglePortal() {
    const current = this.config();
    if (current) {
      this.config.set({
        ...current,
        isPublicPortalOpen: !current.isPublicPortalOpen
      });
    }
  }

  // --- GESTION DES SERVICES ---

  isServiceEnabled(code: string): boolean {
    return this.config()?.enabledServices.includes(code) || false;
  }

  toggleService(code: string) {
    const current = this.config();
    if (!current) return;

    const services = [...current.enabledServices];
    const index = services.indexOf(code);
    
    if (index > -1) services.splice(index, 1);
    else services.push(code);

    this.config.set({ ...current, enabledServices: services });
  }

  // --- GESTION DES DOCUMENTS ---

  updateDocumentMandatory(code: string, mandatory: boolean) {
    const current = this.config();
    if (current) {
      const updatedDocs = current.documentChecklist.map(doc => 
        doc.code === code ? { ...doc, mandatory } : doc
      );
      this.config.set({ ...current, documentChecklist: updatedDocs });
    }
  }

  // --- PREVIEW ---

  previewPortal() {
    window.open('/enrollment', '_blank');
  }
}
