import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Printer, Download,
  User, Mail, Phone, MapPin, FileText,
  CreditCard, Pencil, MoreVertical, Eye,
  Plus, MessageSquare, History, File,
  FileImage, FileSpreadsheet, RefreshCw, ClipboardCheck, GraduationCap, Info
} from 'lucide-angular';
import { firstValueFrom } from 'rxjs';

import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { AdmissionWorkflowComponent, AdmissionState } from '../components/admission-workflow/admission-workflow.component';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { DocumentEngineService } from '../../../../../core/services/document-engine.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AdmissionApplication, RequiredDocument } from '../../../../../core/models/enrollment.model';
import { Level, Filiere } from '../../../../../core/models/academic.model';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, AdmissionWorkflowComponent, FormsModule, MatDialogModule],
  templateUrl: './admission-detail.component.html',
  styleUrls: ['./admission-detail.component.scss']
})
export class AdmissionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private enrollmentAdminService = inject(EnrollmentAdminService);
  private documentService = inject(DocumentEngineService);
  private academicService = inject(AcademicService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  // --- ÉTATS ---
  application = signal<AdmissionApplication | null>(null);
  isLoading = signal(true);
  isActionLoading = signal(false);

  levels = signal<Level[]>([]);
  filieres = signal<Filiere[]>([]);

  showDocumentViewer = signal(false);
  selectedDoc = signal<RequiredDocument | null>(null);
  selectedDocUrl = signal<string | null>(null);

  // --- CALCULS RÉACTIFS ---
  levelName = computed(() => {
    const app = this.application();
    if (!app) return '...';
    return this.levels().find(l => l.id === app.levelId)?.name || 'Niveau inconnu';
  });

  filiereName = computed(() => {
    const app = this.application();
    if (!app || !app.filiereId) return null;
    return this.filieres().find(f => f.id === app.filiereId)?.name || 'Filière inconnue';
  });

  // Checklist de validation pour la direction
  isReadyForFinalValidation = computed(() => {
    const app = this.application();
    if (!app || app.status !== 'TESTING') return false;

    // 1. Tous les documents obligatoires doivent être reçus
    const mandatoryDocs = app.documents.filter(d => d.mandatory);
    const allDocsOk = mandatoryDocs.every(d => d.status === 'UPLOADED' || d.status === 'PHYSICAL_RECEIVED');

    // 2. L'évaluation doit avoir été saisie
    const assessmentOk = !!app.assessment && !!app.assessment.decision;

    return allDocsOk && assessmentOk;
  });

  mandatoryDocsSummary = computed(() => {
    const app = this.application();
    if (!app) return { total: 0, received: 0 };
    const mandatory = app.documents.filter(d => d.mandatory);
    return {
      total: mandatory.length,
      received: mandatory.filter(d => d.status === 'UPLOADED' || d.status === 'PHYSICAL_RECEIVED').length
    };
  });

  // --- ÉVALUATION (Local state avant soumission) ---
  evaluationGrades = signal<Record<string, number>>({
    'Français': 0,
    'Mathématiques': 0,
    'Éveil': 0
  });
  evaluationComment = '';
  pedagogicalDecision = signal<'ADMITTED' | 'REJECTED' | 'WAITLIST'>('ADMITTED');

  averageScore = computed(() => {
    const grades = Object.values(this.evaluationGrades());
    const sum = grades.reduce((acc, curr) => acc + curr, 0);
    return (sum / grades.length).toFixed(2);
  });

  updateGrade(subject: string, value: number) {
    this.evaluationGrades.update(prev => ({
      ...prev,
      [subject]: value
    }));
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadApplication(id);
    }
  }

  async loadApplication(id: string) {
    this.isLoading.set(true);
    try {
      const [data, levels, filieres] = await Promise.all([
        firstValueFrom(this.enrollmentAdminService.getApplicationById(id)),
        this.academicService.getLevels(),
        this.academicService.getFilieres()
      ]);

      this.application.set(data);
      this.levels.set(levels);
      this.filieres.set(filieres);

      // Pré-remplir l'évaluation si elle existe déjà
      if (data.assessment) {
        this.evaluationGrades.set(data.assessment.grades);
        this.evaluationComment = data.assessment.comments || '';
        this.pedagogicalDecision.set(data.assessment.decision as any);
      }
    } catch (e) {
      console.error('Erreur chargement dossier:', e);
      this.notificationService.error('Impossible de charger les données du dossier.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Action 1 : Marquer un document comme reçu physiquement
   */
  async receiveDocument(docCode: string) {
    if (!this.application()) return;
    this.isActionLoading.set(true);
    try {
      const updated = await firstValueFrom(this.enrollmentAdminService.receivePhysicalDocument(this.application()!.id, docCode));
      this.application.set(updated);
      this.notificationService.success('Document marqué comme reçu.');
    } catch (e) {
      this.notificationService.error('Erreur lors de la réception du document.');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  /**
   * Action 2 : Valider la conformité administrative (Passage en VERIFIED)
   */
  async verifyApplication() {
    if (!this.application()) return;
    this.isActionLoading.set(true);
    try {
      const updated = await firstValueFrom(this.enrollmentAdminService.verifyApplication(this.application()!.id));
      this.application.set(updated);
      this.notificationService.success('Dossier validé administrativement.');
    } catch (e) {
      this.notificationService.error('Erreur lors de la vérification administrative.');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  /**
   * Action 3 : Enregistrer l'évaluation pédagogique (Passage en TESTING)
   */
  async submitAssessment() {
    if (!this.application()) return;
    this.isActionLoading.set(true);
    try {
      const payload = {
        grades: this.evaluationGrades(),
        comments: this.evaluationComment,
        decision: this.pedagogicalDecision()
      };
      const updated = await firstValueFrom(this.enrollmentAdminService.submitAssessment(this.application()!.id, payload));
      this.application.set(updated);
      this.notificationService.success('Évaluation enregistrée avec succès.');
    } catch (e) {
      this.notificationService.error('Erreur lors de l\'enregistrement de l\'évaluation.');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  /**
   * Action 4 : Validation finale par la direction (Passage en VALIDATED)
   */
  async validateFinal() {
    if (!this.application()) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer l\'admission',
        message: 'Confirmez-vous l\'admission définitive de cet élève ? Cette action est irréversible.',
        confirmLabel: 'Confirmer l\'Admission',
        type: 'warning'
      }
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    this.isActionLoading.set(true);
    try {
      const updated = await firstValueFrom(this.enrollmentAdminService.validateAdmission(this.application()!.id));
      this.application.set(updated);
      this.notificationService.success('Admission validée avec succès !');
    } catch (e) {
      this.notificationService.error('Erreur lors de la validation finale. Vérifiez que tous les documents sont présents.');
    } finally {
      this.isActionLoading.set(false);
    }
  }

  /**
   * Visualiser un document
   */
  async previewDocument(doc: RequiredDocument) {
    if (doc.status === 'MISSING') return;

    this.selectedDoc.set(doc);
    this.showDocumentViewer.set(true);
    this.selectedDocUrl.set(null);

    try {
      // Si le document a un fileUrl (UUID), on demande une URL pré-signée
      if (doc.fileUrl) {
        const viewUrl = await firstValueFrom(this.documentService.getViewUrl(doc.fileUrl));
        this.selectedDocUrl.set(viewUrl);
      }
    } catch (e) {
      console.error('Erreur génération URL de vue:', e);
    }
  }

  // Méthode pour l'icône dynamique selon le type de fichier
  getFileIcon(fileName: string): any {
    if (fileName.includes('Photo')) return FileImage;
    if (fileName.includes('Bulletin')) return FileSpreadsheet;
    return FileText;
  }

  // Exposition des icônes
  readonly ArrowLeft = ArrowLeft;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly CheckCircle = CheckCircle;
  readonly ClipboardCheck = ClipboardCheck;
  readonly GraduationCap = GraduationCap;
  readonly XCircle = XCircle;
  readonly Printer = Printer;
  readonly Download = Download;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly FileText = FileText;
  readonly CreditCard = CreditCard;
  readonly Pencil = Pencil;
  readonly MoreVertical = MoreVertical;
  readonly Eye = Eye;
  readonly Plus = Plus;
  readonly MessageSquare = MessageSquare;
  readonly History = History;
  readonly File = File;
  readonly FileImage = FileImage;
  readonly FileSpreadsheet = FileSpreadsheet;
  readonly RefreshCw = RefreshCw;
  protected readonly Info = Info;
}
