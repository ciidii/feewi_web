import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {finalize, switchMap, forkJoin, of, map} from 'rxjs';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { AdmissionApplication, RequiredDocument, AssessmentRequest } from '../../../../../core/models/enrollment.model';
import {
  ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck,
  Download, Eye, FileImage, FileSpreadsheet, FileText, GraduationCap,
  History as HistoryIcon, Info, LucideAngularModule, Mail, MapPin,
  Phone, Plus, Printer, RefreshCw, User, XCircle, Save, ShieldCheck, Upload
} from 'lucide-angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EnrollmentAdminService } from '../../../../../core/services/enrollment-admin.service';
import { DocumentEngineService } from '../../../../../core/services/document-engine.service';
import { AcademicService } from '../../../../../core/services/academic.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { Filiere, Level, AcademicYear } from '../../../../../core/models/academic.model';
import { AdmissionWorkflowComponent } from '../components/admission-workflow/admission-workflow.component';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  private sanitizer = inject(DomSanitizer);

  // --- ÉTATS ---
  application = signal<AdmissionApplication | null>(null);
  isLoading = signal(true);
  isActionLoading = signal(false);
  uploadingDocCode = signal<string | null>(null); // AJOUTÉ : Pour le feedback d'upload admin

  levels = signal<Level[]>([]);
  filieres = signal<Filiere[]>([]);
  activeYear = signal<AcademicYear | null>(null); // AJOUTÉ

  showDocumentViewer = signal(false);
  selectedDoc = signal<RequiredDocument | null>(null);
  selectedDocUrl = signal<SafeResourceUrl | null>(null);

  // --- CONFIGURATION DYNAMIQUE ---
  assessmentSubjects = signal<string[]>([]);
  minPassingGrade = signal<number>(10);

  // --- CALCULS RÉACTIFS ---
  levelName = computed(() => {
    const app = this.application();
    if (!app) return '...';
    return this.levels().find(l => l.id === app.wish?.levelId)?.name || 'Niveau inconnu';
  });

  filiereName = computed(() => {
    const app = this.application();
    if (!app || !app.wish?.filiereId) return null;
    return this.filieres().find(f => f.id === app.wish.filiereId)?.name || 'Filière inconnue';
  });

  isReadyForFinalValidation = computed(() => {
    const app = this.application();
    if (!app || app.status !== 'TESTING') return false;

    // VERROU NUMÉRIQUE : Tous les documents obligatoires doivent être UPLOADED
    const mandatoryDocs = app.documents.filter(d => d.mandatory);
    const allDocsUploaded = mandatoryDocs.every(d => d.status === 'UPLOADED');

    const assessmentOk = !!app.assessment && !!app.assessment.decision;
    return allDocsUploaded && assessmentOk;
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

  // --- ÉVALUATION ---
  evaluationGrades = signal<Record<string, number>>({});
  evaluationComment = '';
  pedagogicalDecision = signal<'ADMITTED' | 'REJECTED' | 'WAITLIST'>('ADMITTED');
  recommendedLevelId = signal<string | null>(null);

  averageScore = computed(() => {
    const grades = Object.values(this.evaluationGrades());
    if (grades.length === 0) return '0.00';
    const sum = grades.reduce((acc, curr) => acc + curr, 0);
    return (sum / grades.length).toFixed(2);
  });

  updateGrade(subject: string, value: number) {
    this.evaluationGrades.update(prev => ({ ...prev, [subject]: value }));
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadApplication(id);
  }

  /**
   * Chargement réactif des données (RxJS pur)
   */
  loadApplication(id: string) {
    this.isLoading.set(true);

    forkJoin({
      app: this.enrollmentAdminService.getApplicationById(id),
      levels: this.academicService.getLevels(),
      filieres: this.academicService.getFilieres(),
      year: this.academicService.getCurrentYear()
    }).pipe(
      switchMap(({ app, levels, filieres, year }) => {
        console.log('[AdmissionDetail Debug] Objet APP brut reçu du serveur:', app);
        this.application.set(app);
        this.levels.set(levels);
        this.filieres.set(filieres);
        this.activeYear.set(year);

        // SECURITÉ : On lit l'ID dans l'objet 'wish' identifié dans le JSON
        const targetLevelId = app.wish?.levelId;

        if (targetLevelId) {
          return this.enrollmentAdminService.getEffectiveConfig(targetLevelId);
        } else {
          console.warn('[AdmissionDetail] Dossier sans niveau (wish.levelId absent), fallback config globale');
          return this.enrollmentAdminService.getConfig();
        }
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (effectiveConfig) => {
        const aConfig = effectiveConfig.assessmentConfig || effectiveConfig.defaultAssessmentConfig;
        if (aConfig) {
          this.assessmentSubjects.set(aConfig.subjects || []);
          this.minPassingGrade.set(aConfig.minPassingGrade || 10);

          const app = this.application();
          const initialGrades: Record<string, number> = {};

          if (aConfig.subjects && Array.isArray(aConfig.subjects)) {
            aConfig.subjects.forEach((sub: string) => {
              initialGrades[sub] = app?.assessment?.grades?.[sub] || 0;
            });
          }
          this.evaluationGrades.set(initialGrades);
        }

        const data = this.application();
        if (data?.assessment) {
          this.evaluationComment = data.assessment.comments || '';
          this.pedagogicalDecision.set(data.assessment.decision as any);
          this.recommendedLevelId.set(data.assessment.recommendedLevelId || null);
        }
      },
      error: (err) => {
        console.error('Erreur chargement dossier:', err);
        this.notificationService.error('Impossible de charger les données du dossier.');
      }
    });
  }

  receiveDocument(docCode: string) {
    const app = this.application();
    if (!app) return;
    this.isActionLoading.set(true);
    this.enrollmentAdminService.receivePhysicalDocument(app.id, docCode).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id); // Refresh complet pour éviter l'écran blanc
        this.notificationService.success('Document marqué comme reçu.');
      }
    });
  }

  /**
   * Action Secrétariat : Numériser un document reçu physiquement
   * (Phase 3.3 du workflow hybride)
   */
  onAdminFileSelected(docCode: string, event: any) {
    const file = event.target.files[0];
    const app = this.application();

    if (!file || !app) return;

    this.uploadingDocCode.set(docCode);

    this.documentService.getUploadTicket({
      fileName: file.name,
      contentType: file.type,
      serviceOrigin: 'enrollment'
    }).pipe(
      switchMap(ticket =>
        this.documentService.uploadFileDirectly(ticket.uploadUrl, file).pipe(
          switchMap(() => this.enrollmentAdminService.linkDocument(app.id, docCode, ticket.fileId)),
          map(() => ticket)
        )
      ),
      finalize(() => {
        this.uploadingDocCode.set(null);
        event.target.value = ''; // Reset input
      })
    ).subscribe({
      next: () => {
        this.loadApplication(app.id);
        this.notificationService.success(`Document "${file.name}" numérisé avec succès.`);
      },
      error: (err) => console.error('[AdminUpload] Erreur:', err)
    });
  }

  verifyApplication() {
    const app = this.application();
    if (!app) return;
    this.isActionLoading.set(true);
    this.enrollmentAdminService.verifyApplication(app.id).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id); // Refresh complet
        this.notificationService.success('Dossier validé administrativement.');
      }
    });
  }

  submitAssessment() {
    const app = this.application();
    if (!app) return;
    this.isActionLoading.set(true);

    const payload: AssessmentRequest = {
      grades: this.evaluationGrades(),
      comments: this.evaluationComment,
      decision: this.pedagogicalDecision(),
      recommendedLevelId: this.recommendedLevelId() || undefined
    };

    this.enrollmentAdminService.submitAssessment(app.id, payload).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id); // Refresh complet
        this.notificationService.success('Évaluation enregistrée avec succès.');
      }
    });
  }

  validateFinal() {
    const app = this.application();
    if (!app) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer l\'admission',
        message: 'Confirmez-vous l\'admission définitive de cet élève ? Cette action est irréversible.',
        confirmLabel: 'Confirmer l\'Admission',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().pipe(
      switchMap(confirmed => {
        if (confirmed) {
          this.isActionLoading.set(true);
          return this.enrollmentAdminService.validateAdmission(app.id);
        }
        return of(null);
      }),
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: (updated) => {
        if (updated) {
          this.loadApplication(app.id); // Refresh complet
          this.notificationService.success('Admission validée avec succès !');
        }
      }
    });
  }

  previewDocument(doc: RequiredDocument) {
    if (doc.status === 'MISSING') return;
    this.selectedDoc.set(doc);
    this.showDocumentViewer.set(true);
    this.selectedDocUrl.set(null);

    if (doc.fileUrl) {
      this.documentService.getViewUrl(doc.fileUrl).subscribe({
        next: (viewUrl) => {
          // SECURISATION : On autorise cette URL pour l'iframe
          const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewUrl);
          this.selectedDocUrl.set(safeUrl);
        },
        error: (err) => console.error('Erreur génération URL de vue:', err)
      });
    }
  }

  getFileIcon(fileName: string): any {
    if (fileName.includes('Photo')) return FileImage;
    if (fileName.includes('Bulletin')) return FileSpreadsheet;
    return FileText;
  }

  // --- READONLY ICONS ---
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
  readonly Eye = Eye;
  readonly Plus = Plus;
  readonly HistoryIcon = HistoryIcon;
  readonly RefreshCw = RefreshCw;
  readonly Save = Save;
  readonly ShieldCheck = ShieldCheck; // AJOUTÉ
  protected readonly Info = Info;
  protected readonly Upload = Upload;
}
