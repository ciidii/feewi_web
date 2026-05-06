import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {finalize, forkJoin, map, of, switchMap} from 'rxjs';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  GraduationCap,
  HeartPulse,
  History as HistoryIcon,
  Info,
  Loader2, Lock,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Save,
  School,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  XCircle
} from 'lucide-angular';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {EnrollmentAdminService} from '../../../../../core/services/enrollment-admin.service';
import {DocumentEngineService} from '../../../../../core/services/document-engine.service';
import {AcademicService} from '../../../../../core/services/academic.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AcademicYear, Filiere, Level} from '../../../../../core/models/academic.model';
import {AdmissionWorkflowComponent} from '../components/admission-workflow/admission-workflow.component';
import {FormsModule} from '@angular/forms';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {Admission, AssessmentRequest, RequiredDocument} from '../../../../../core/models/enrollment.model';
import {EnrollmentSchema, ServiceConfig} from '../../../../../core/models/enrollment/config';
import {BlockLoaderComponent} from '../../../../../shared/components/loader/block-loader.component';
import {PageProgressComponent} from '../../../../../shared/components/loader/page-progress.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {
  AdmissionDetailSkeletonComponent
} from '../../../../../shared/components/skeleton/admission-detail-skeleton.component';
import {CamelToLabelPipe} from '../../../../../shared/pipes/camel-to-label.pipe';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    AdmissionWorkflowComponent,
    FormsModule,
    MatDialogModule,
    FwPageShellComponent,
    FwButtonComponent,
    CamelToLabelPipe,
    AdmissionDetailSkeletonComponent,
    BlockLoaderComponent,
    PageProgressComponent
  ],

  templateUrl: './admission-detail.component.html',
  styleUrls: ['./admission-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
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
  application = signal<Admission | null>(null);
  isLoading = signal(true);
  isActionLoading = signal(false);
  uploadingDocCode = signal<string | null>(null);

  levels = signal<Level[]>([]);
  filieres = signal<Filiere[]>([]);
  activeYear = signal<AcademicYear | null>(null);

  showDocumentViewer = signal(false);
  selectedDoc = signal<RequiredDocument | null>(null);
  selectedDocUrl = signal<SafeResourceUrl | null>(null);

  // --- CONFIGURATION DYNAMIQUE ---
  effectiveSchema = signal<EnrollmentSchema | null>(null);
  assessmentSubjects = signal<string[]>([]);
  minPassingGrade = signal<number>(10);
  servicesConfig = signal<ServiceConfig[]>([]);

  // --- CALCULS RÉACTIFS ---
  canVerify = computed(() => this.application()?.status === 'SUBMITTED');

  canAssess = computed(() => {
    const status = this.application()?.status;
    return status === 'VERIFIED' || status === 'TESTING';
  });

  canValidate = computed(() => {
    const app = this.application();
    if (!app) return false;
    const validStatus = ['ADMITTED', 'WAITLIST'].includes(app.status);
    return validStatus && !!app.assessment;
  });

  age = computed(() => {
    const app = this.application();
    if (!app?.identity?.birthDate) return null;
    const birth = new Date(app.identity.birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  });

  levelName = computed(() => {
    const app = this.application();
    if (!app) return '...';
    return app.schooling.levelLabel
      || this.levels().find(l => l.id === app.schooling.levelId)?.name
      || 'Niveau inconnu';
  });

  filiereName = computed(() => {
    const app = this.application();
    if (!app || !app.schooling.filiereId) return null;
    return this.filieres().find(f => f.id === app.schooling.filiereId)?.name || 'Filière inconnue';
  });

  fullName = computed(() => {
    const app = this.application();
    if (!app) return 'Dossier';
    return `${app.identity.firstName} ${app.identity.lastName}`;
  });

  isReadyForFinalValidation = computed(() => {
    const app = this.application();
    if (!app || !this.canValidate()) return false;

    const mandatoryDocs = app.documents.filter(d => d.mandatory);
    return mandatoryDocs.every(d =>
      ['UPLOADED', 'RECEIVED', 'VERIFIED'].includes(d.status)
    );
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadApplication(id);
  }

  loadApplication(id: string) {
    this.isLoading.set(true);

    forkJoin({
      app: this.enrollmentAdminService.getApplicationById(id),
      levels: this.academicService.getLevels(),
      filieres: this.academicService.getFilieres(),
      year: this.academicService.getCurrentYear()
    }).pipe(
      switchMap(({app, levels, filieres, year}) => {
        this.application.set(app);
        this.levels.set(levels);
        this.filieres.set(filieres);
        this.activeYear.set(year);

        const targetLevelId = app.schooling.levelId;
        if (targetLevelId) {
          return this.enrollmentAdminService.getEffectiveConfig(targetLevelId);
        } else {
          return this.enrollmentAdminService.getConfig().pipe(
            map(cfg => ({schema: cfg.schema}))
          );
        }
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (effectiveConfig: any) => {
        if (effectiveConfig?.schema) {
          this.effectiveSchema.set(effectiveConfig.schema as EnrollmentSchema);
        }

        const aConfig = effectiveConfig?.schema?.assessment;
        if (aConfig) {
          const subjectKeys = Object.keys(aConfig.subjects || {});
          this.assessmentSubjects.set(subjectKeys);
          this.minPassingGrade.set(aConfig.minPassingGrade || 10);

          const app = this.application();
          const initialGrades: Record<string, number> = {};
          subjectKeys.forEach((sub: string) => {
            initialGrades[sub] = app?.assessment?.grades?.[sub] || 0;
          });
          this.evaluationGrades.set(initialGrades);
        }

        const sConfig = effectiveConfig?.schema?.services?.availableServices;
        if (sConfig?.length) {
          this.servicesConfig.set(sConfig);
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

  // --- ACTIONS ---

  verifyApplication() {
    const app = this.application();
    if (!app) return;
    this.isActionLoading.set(true);
    this.enrollmentAdminService.verifyApplication(app.id).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id);
        this.notificationService.success('Dossier validé administrativement.');
      }
    });
  }

  admitManually() {
    const app = this.application();
    if (!app) return;
    this.isActionLoading.set(true);
    this.enrollmentAdminService.admitAdmission(app.id).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id);
        this.notificationService.success('Candidat admis manuellement.');
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
          this.loadApplication(app.id);
          this.notificationService.success('Admission validée avec succès !');
        }
      }
    });
  }

  overruleFinal() {
    const app = this.application();
    if (!app) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Validation avec dérogation',
        message: 'Vous allez valider ce dossier malgré des pièces manquantes ou un verrou numérique. Confirmer ?',
        confirmLabel: 'Passer outre et Valider',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().pipe(
      switchMap(confirmed => {
        if (confirmed) {
          this.isActionLoading.set(true);
          return this.enrollmentAdminService.overruleAdmission(app.id);
        }
        return of(null);
      }),
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: (updated) => {
        if (updated) {
          this.loadApplication(app.id);
          this.notificationService.warning('Admission validée par dérogation.');
        }
      }
    });
  }

  rejectFinal() {
    const app = this.application();
    if (!app) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Rejeter la candidature',
        message: 'Veuillez saisir le motif du rejet qui sera visible par les parents :',
        confirmLabel: 'Confirmer le Rejet',
        type: 'danger',
        showInput: true,
        inputPlaceholder: 'Ex: Niveau insuffisant pour le niveau demandé.'
      }
    });

    dialogRef.afterClosed().pipe(
      switchMap(result => {
        if (result?.confirmed) {
          this.isActionLoading.set(true);
          return this.enrollmentAdminService.rejectAdmission(app.id, result.inputValue);
        }
        return of(null);
      }),
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: (updated) => {
        if (updated) {
          this.loadApplication(app.id);
          this.notificationService.error('Candidature rejetée.');
        }
      }
    });
  }

  waitlistFinal() {
    const app = this.application();
    if (!app) return;

    this.isActionLoading.set(true);
    this.enrollmentAdminService.waitlistAdmission(app.id).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id);
        this.notificationService.warning('Dossier placé en liste d\'attente.');
      }
    });
  }

  cancelAdmission() {
    const app = this.application();
    if (!app) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Annuler le dossier',
        message: 'Souhaitez-vous vraiment annuler ce dossier ? Cette action est définitive.',
        confirmLabel: 'Annuler définitivement',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().pipe(
      switchMap(confirmed => {
        if (confirmed) {
          this.isActionLoading.set(true);
          return this.enrollmentAdminService.cancelAdmission(app.id);
        }
        return of(null);
      }),
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: (success) => {
        if (success !== null) {
          this.loadApplication(app.id);
          this.notificationService.info('Dossier annulé.');
        }
      }
    });
  }

  // --- DOCUMENTS ---

  receiveDocument(docCode: string) {
    const app = this.application();
    if (!app) return;
    this.isActionLoading.set(true);
    this.enrollmentAdminService.receivePhysicalDocument(app.id, docCode).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id);
        this.notificationService.success('Document marqué comme reçu.');
      }
    });
  }

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

  previewDocument(doc: RequiredDocument) {
    if (doc.status === 'MISSING') return;
    this.selectedDoc.set(doc);
    this.showDocumentViewer.set(true);
    this.selectedDocUrl.set(null);

    if (doc.fileUrl) {
      this.documentService.getViewUrl(doc.fileUrl).subscribe({
        next: (viewUrl) => {
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
    this.evaluationGrades.update(prev => ({...prev, [subject]: value}));
  }

  submitPedagogicalDecision() {
    const app = this.application();
    if (!app) return;

    this.isActionLoading.set(true);
    const decision = this.pedagogicalDecision();

    const payload: AssessmentRequest = {
      grades: this.evaluationGrades(),
      comments: this.evaluationComment,
      decision: decision === 'WAITLIST' ? null : decision,
      recommendedLevelId: this.recommendedLevelId()
    };

    this.enrollmentAdminService.submitAssessment(app.id, payload).pipe(
      finalize(() => this.isActionLoading.set(false))
    ).subscribe({
      next: () => {
        this.loadApplication(app.id);
        this.notificationService.success('Décision pédagogique enregistrée.');
      }
    });
  }

  mandatoryDocsSummary = computed(() => {
    const app = this.application();
    if (!app) return {total: 0, received: 0};
    const mandatory = app.documents.filter(d => d.mandatory);
    return {
      total: mandatory.length,
      received: mandatory.filter(d => d.status === 'UPLOADED' || d.status === 'RECEIVED').length
    };
  });

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getServiceConfig(serviceCode: string): ServiceConfig | undefined {
    return this.servicesConfig().find(s => s.code === serviceCode);
  }


  // --- ICONS ---
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
  readonly ShieldCheck = ShieldCheck;
  readonly HeartPulse = HeartPulse;
  readonly School = School;
  readonly Users = Users;
  readonly Upload = Upload;
  readonly Trash2 = Trash2;
  readonly BadgeCheck = BadgeCheck;
  readonly Globe = Globe;
  readonly ArrowRight = ArrowRight;
  readonly Activity = Activity;
  protected readonly Info = Info;
  protected readonly Loader2 = Loader2;
  protected readonly Sparkles = Sparkles;
  protected readonly Lock = Lock;
}
