import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {finalize, forkJoin} from 'rxjs';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Calendar, CheckCircle,
  Download,
  Edit, GraduationCap,
  History, Info, Layers,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  Printer,
  ReceiptText,
  RefreshCw,
  Stethoscope,
  User,
  Users, Wallet, XCircle
} from 'lucide-angular';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';

import {StudentRegistryService} from '../../../../../core/services/student-registry.service';
import {StudentResponse} from '../../../../../core/models/student.model';
import {AcademicService} from '../../../../../core/services/academic.service';
import {Level} from '../../../../../core/models/academic.model';
import {BillingService} from '../../../../../core/services/billing.service';
import {FeeType, InstallmentPlan, InstallmentStatus, InstallmentTranche, ServiceRecoveryLine, StudentStatement} from '../../../../../core/models/billing.model';
import {DocumentEngineService} from '../../../../../core/services/document-engine.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {AuthService} from '../../../../../core/services/auth.service';
import {ConfirmDialogComponent} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwInfoCardComponent} from '../../../../../shared/components/info-card/info-card.component';
import {CamelToLabelPipe} from '../../../../../shared/pipes/camel-to-label.pipe';
import {PageProgressComponent} from '../../../../../shared/components/loader/page-progress.component';
import {BlockLoaderComponent} from '../../../../../shared/components/loader/block-loader.component';
import {FwDatePipe} from '../../../../../shared/pipes/fw-date.pipe';
import {PaymentFormComponent} from './components/payment-form/payment-form.component';
import {InstallmentPlanFormComponent} from './components/installment-plan-form/installment-plan-form.component';
import {FeeItemFormComponent} from './components/fee-item-form/fee-item-form.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterModule,
    MatDialogModule,
    FwPageShellComponent,
    FwBadgeComponent,
    FwButtonComponent,
    FwInfoCardComponent,
    CamelToLabelPipe,
    BlockLoaderComponent,
    FwDatePipe
  ],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentRegistryService);
  private academicService = inject(AcademicService);
  private billingService = inject(BillingService);
  private documentEngineService = inject(DocumentEngineService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  // --- ICONS ---
  readonly ArrowLeft = ArrowLeft;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly HistoryIcon = History;
  readonly Edit = Edit;
  readonly Printer = Printer;
  readonly Download = Download;
  readonly AlertCircle = AlertCircle;
  readonly Stethoscope = Stethoscope;
  readonly Users = Users;
  readonly RefreshCw = RefreshCw;
  readonly Archive = Archive;
  readonly Wallet = Wallet;
  readonly ReceiptText = ReceiptText;
  readonly AlertTriangle = AlertTriangle;
  readonly Layers = Layers;

  // --- ÉTATS ---
  student = signal<StudentResponse | null>(null);
  levels = signal<Level[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);

  // --- FINANCE ---
  statement = signal<StudentStatement | null>(null);
  feeTypes = signal<FeeType[]>([]);
  installmentPlans = signal<InstallmentPlan[]>([]);
  isFinanceLoading = signal(false);
  generatingReceiptForPaymentId = signal<string | null>(null);

  readonly canReadFinanceAction = computed(() =>
    this.authService.hasAnyPermission(['finance:payment:read', 'finance:report:read', 'finance:fee:manage'])
  );
  readonly canRecordPaymentAction = computed(() => this.authService.hasPermission('finance:payment:write'));
  readonly canManageFeeAction = computed(() => this.authService.hasPermission('finance:fee:manage'));

  readonly sortedPayments = computed(() => {
    const st = this.statement();
    if (!st) return [];
    return [...st.payments].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  });

  /** ADR-013 : total facturé cette année = Σ des mensualités affichées (facturé à ce jour). */
  readonly billedThisYear = computed(() =>
    (this.statement()?.monthlyBreakdown ?? []).reduce((sum, m) => sum + m.amount, 0)
  );

  /** ADR-014 : recouvrement par service (payé alloué par priorité). */
  readonly serviceRecovery = computed<ServiceRecoveryLine[]>(() => this.statement()?.serviceRecovery ?? []);

  /** Pourcentage 0..100 pour la barre de progression (null si dû = 0 → traité comme 0%). */
  recoveryPercent(line: ServiceRecoveryLine): number {
    return line.recoveryRate == null ? 0 : Math.round(line.recoveryRate * 100);
  }

  // --- CALCULS ---
  fullName = computed(() => {
    const s = this.student();
    return s ? `${s.firstName} ${s.lastName.toUpperCase()}` : '...';
  });

  currentLevelName = computed(() => {
    const s = this.student();
    if (!s || s.history.length === 0) return 'Non affecté';
    const lastHistory = s.history[s.history.length - 1];
    return lastHistory.levelName || this.levels().find(l => l.id === lastHistory.levelId)?.name || 'Niveau inconnu';
  });

  canArchive = computed(() => {
    const s = this.student();
    return !!s && s.status === 'LEFT' && this.authService.hasPermission('student:registry:archive');
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadData(id);
  }

  loadData(id: string) {
    this.isLoading.set(true);
    forkJoin({
      student: this.studentService.getStudentById(id),
      levels: this.academicService.getLevels()
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.student.set(data.student);
        this.levels.set(data.levels);
        if (this.canReadFinanceAction()) this.loadFinance(id);
      },
      error: (err) => {
        console.error('Erreur chargement dossier élève:', err);
        this.notificationService.error('Impossible de charger le dossier de l\'élève.');
      }
    });
  }

  loadFinance(studentId: string) {
    this.isFinanceLoading.set(true);
    forkJoin({
      statement: this.billingService.getStudentStatement(studentId),
      feeTypes: this.billingService.getFeeTypes(),
      installmentPlans: this.billingService.getInstallmentPlans(studentId)
    }).pipe(
      finalize(() => this.isFinanceLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.statement.set(data.statement);
        this.feeTypes.set(data.feeTypes);
        this.installmentPlans.set(data.installmentPlans);
      },
      error: (err) => console.error('Erreur chargement finance élève:', err)
    });
  }

  openPaymentDialog() {
    const s = this.student();
    if (!s) return;

    const dialogRef = this.dialog.open(PaymentFormComponent, {
      width: '500px',
      panelClass: 'feewi-dialog-panel',
      data: {studentId: s.id, studentName: this.fullName(), feeTypes: this.feeTypes(), installmentPlans: this.installmentPlans()}
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved) this.loadFinance(s.id);
    });
  }

  openInstallmentPlanDialog() {
    const s = this.student();
    if (!s) return;

    const dialogRef = this.dialog.open(InstallmentPlanFormComponent, {
      width: '500px',
      panelClass: 'feewi-dialog-panel',
      data: {studentId: s.id, studentName: this.fullName(), feeTypes: this.feeTypes()}
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved) this.loadFinance(s.id);
    });
  }

  openFeeItemDialog() {
    const s = this.student();
    if (!s) return;

    const dialogRef = this.dialog.open(FeeItemFormComponent, {
      width: '500px',
      panelClass: 'feewi-dialog-panel',
      data: {studentId: s.id, studentName: this.fullName(), feeTypes: this.feeTypes()}
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved) this.loadFinance(s.id);
    });
  }

  getFeeTypeLabel(code: string): string {
    return this.feeTypes().find(f => f.code === code)?.label || code;
  }

  getInstallmentStatusToken(status: InstallmentStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'OVERDUE':
        return 'error';
      default:
        return 'neutral';
    }
  }

  getInstallmentStatusLabel(tranche: InstallmentTranche): string {
    switch (tranche.status) {
      case 'PAID':
        return 'Payée';
      case 'OVERDUE':
        return `En retard (${tranche.daysOverdue}j)`;
      default:
        return 'En attente';
    }
  }

  generateReceipt(paymentId: string) {
    const s = this.student();
    if (!s || this.generatingReceiptForPaymentId()) return;

    const requestedBy = this.authService.currentUser()?.email ?? '';
    this.generatingReceiptForPaymentId.set(paymentId);
    this.documentEngineService.generatePaymentReceipt(s.id, paymentId, requestedBy).pipe(
      finalize(() => this.generatingReceiptForPaymentId.set(null))
    ).subscribe({
      next: (response) => {
        window.open(response.downloadUrl, '_blank');
        this.notificationService.success(`Reçu ${response.receiptNumber} généré.`);
      }
    });
  }

  toggleStatus() {
    const s = this.student();
    if (!s) return;

    const newStatus = s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'Réactiver' : 'Suspendre';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${actionLabel} l'élève`,
        message: `Voulez-vous vraiment ${actionLabel.toLowerCase()} cet élève ?`,
        confirmLabel: actionLabel,
        type: newStatus === 'ACTIVE' ? 'primary' : 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isActionLoading.set(true);
        this.studentService.updateStudent(s.id, {status: newStatus}).pipe(
          finalize(() => this.isActionLoading.set(false))
        ).subscribe(() => {
          this.loadData(s.id);
        });
      }
    });
  }

  archiveStudent() {
    const s = this.student();
    if (!s) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Archiver le dossier',
        message: `Voulez-vous vraiment archiver le dossier de ${s.firstName} ${s.lastName} ? Cette action est définitive.`,
        confirmLabel: 'Archiver',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isActionLoading.set(true);
        this.studentService.archiveStudent(s.id).pipe(
          finalize(() => this.isActionLoading.set(false))
        ).subscribe(() => {
          this.loadData(s.id);
        });
      }
    });
  }

  getRelationLabel(relation: string): string {
    const labels: Record<string, string> = {
      'FATHER': 'Père',
      'MOTHER': 'Mère',
      'GUARDIAN': 'Tuteur',
      'OTHER': 'Autre'
    };
    return labels[relation] || relation;
  }

  getStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'LEFT':
        return 'danger';
      case 'ARCHIVED':
        return 'info';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Actif',
      'SUSPENDED': 'Suspendu',
      'LEFT': 'Sorti',
      'ARCHIVED': 'Archivé'
    };
    return labels[status] || status;
  }

  protected readonly XCircle = XCircle;
  protected readonly Info = Info;
  protected readonly GraduationCap = GraduationCap;
  protected readonly CheckCircle = CheckCircle;
}
