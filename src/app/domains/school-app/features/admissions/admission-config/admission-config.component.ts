import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Globe, Save, RefreshCw, Eye, Calendar, FileText, ShieldCheck, ToggleLeft as ToggleIcon } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { EnrollmentConfig } from '../../../../../core/models/enrollment.model';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-admission-config',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admission-config.component.html',
  styleUrls: ['./admission-config.component.scss']
})
export class AdmissionConfigComponent implements OnInit {
  private enrollmentService = inject(EnrollmentAdminService);
  private notificationService = inject(NotificationService);

  // --- ÉTATS ---
  config = signal<EnrollmentConfig | null>(null);
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

  async ngOnInit() {
    await this.loadConfig();
  }

  async loadConfig() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(this.enrollmentService.getConfig());
      this.config.set(data);
    } catch (e) {
      console.error('Erreur chargement config:', e);
      this.notificationService.error('Impossible de charger la configuration du portail.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSave() {
    const currentConfig = this.config();
    if (!currentConfig) return;

    this.isSaving.set(true);
    try {
      await firstValueFrom(this.enrollmentService.updateConfig(currentConfig));
      this.notificationService.success('Configuration enregistrée avec succès.');
    } catch (e) {
      console.error('Erreur sauvegarde config:', e);
      this.notificationService.error('Erreur lors de la mise à jour de la configuration.');
    } finally {
      this.isSaving.set(false);
    }
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

  updateDocumentMandatory(code: string, isMandatory: boolean) {
    const current = this.config();
    if (current) {
      const updatedDocs = current.requiredDocuments.map(doc => 
        doc.code === code ? { ...doc, isMandatory } : doc
      );
      this.config.set({ ...current, requiredDocuments: updatedDocs });
    }
  }

  previewPortal() {
    window.open('/public/enroll', '_blank');
  }
}
