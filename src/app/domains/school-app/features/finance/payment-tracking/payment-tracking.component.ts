import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CreditCard, Eye, GraduationCap, LucideAngularModule, RefreshCw, Wallet} from 'lucide-angular';
import {firstValueFrom} from 'rxjs';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {AcademicService} from '../../../../../core/services/academic.service';
import {BillingService} from '../../../../../core/services/billing.service';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {SchoolClass, StudentAssignment} from '../../../../../core/models/academic.model';
import {FeeType, StudentBalance} from '../../../../../core/models/billing.model';
import {DataListComponent} from '../../../../../shared/components/data-list/data-list.component';
import {RowAction, TableRow} from '../../../../../shared/models/data-list.models';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwEmptyStateComponent} from '../../../../../shared/components/empty-state/empty-state.component';
import {FwListCommandBarComponent} from '../../../../../shared/components/list-command-bar/list-command-bar.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {
  PaymentFormComponent
} from '../../registry/student-detail/components/payment-form/payment-form.component';

const WRITE_PERMISSION = 'finance:payment:write';

@Component({
  selector: 'app-payment-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DataListComponent,
    MatDialogModule,
    FwPageShellComponent,
    FwEmptyStateComponent,
    FwListCommandBarComponent,
    FwButtonComponent
  ],
  templateUrl: './payment-tracking.component.html',
  styleUrls: ['./payment-tracking.component.scss']
})
export class PaymentTrackingComponent implements OnInit {
  private academicService = inject(AcademicService);
  private billingService = inject(BillingService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Icônes
  readonly Wallet = Wallet;
  readonly GraduationCap = GraduationCap;
  readonly RefreshCw = RefreshCw;
  readonly Eye = Eye;
  readonly CreditCard = CreditCard;

  // Référentiel classes
  classes = signal<SchoolClass[]>([]);
  isLoadingClasses = signal(true);
  selectedClassId = signal<string>('');

  // Données de l'écran
  roster = signal<StudentAssignment[]>([]);
  balances = signal<StudentBalance[]>([]);
  feeTypes = signal<FeeType[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);

  private balanceByStudentId = computed(() => {
    const map = new Map<string, StudentBalance>();
    for (const balance of this.balances()) {
      map.set(balance.studentId, balance);
    }
    return map;
  });

  // Transformation du roster + soldes pour le DataList, avec filtrage local
  displayRows = computed<TableRow[]>(() => {
    const query = this.searchQuery().toLowerCase();
    const balanceMap = this.balanceByStudentId();

    return this.roster()
      .filter(student => {
        if (!query) return true;
        const fullName = `${student.studentFirstName || ''} ${student.studentLastName || ''}`.toLowerCase();
        return fullName.includes(query) || (student.registrationNumber || '').toLowerCase().includes(query);
      })
      .map(student => {
        // Correspondance défensive par studentId : le roster reste la source de vérité des élèves,
        // le solde peut manquer (retard réseau, élève sans FeeItem) sans faire disparaître la ligne.
        const balance = balanceMap.get(student.studentId);
        const initials = (student.studentFirstName?.[0] || '') + (student.studentLastName?.[0] || '');
        const fullName = `${student.studentFirstName || ''} ${student.studentLastName || ''}`.trim() || 'Élève';

        const amountsSummary = balance
          ? `Dû : ${this.formatAmount(balance.totalDue)} · Payé : ${this.formatAmount(balance.totalPaid)} · Solde : ${this.formatAmount(balance.balance)}`
          : 'Solde indisponible';

        return {
          id: student.studentId,
          title: fullName,
          subtitle: `${student.registrationNumber || 's/n'} · ${amountsSummary}`,
          avatarLabel: initials || '??',
          badges: [
            balance
              ? (balance.balance <= 0
                ? {label: 'Soldé', type: 'success' as const}
                : {label: 'Solde dû', type: 'danger' as const})
              : {label: 'Indisponible', type: 'default' as const}
          ],
          rawData: student
        };
      });
  });

  readonly rowActions: RowAction[] = [
    {id: 'pay', label: 'Enregistrer un paiement', icon: CreditCard, type: 'primary', permission: WRITE_PERMISSION},
    {id: 'view', label: 'Voir le dossier', icon: Eye, type: 'default'}
  ];

  ngOnInit() {
    this.loadClasses();
    this.loadFeeTypes();
  }

  private async loadClasses() {
    this.isLoadingClasses.set(true);
    try {
      const year = await firstValueFrom(this.academicService.getCurrentYear());
      const classes = await firstValueFrom(this.academicService.getClassesByYear(year.id));
      this.classes.set(classes);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoadingClasses.set(false);
    }
  }

  private async loadFeeTypes() {
    try {
      const feeTypes = await firstValueFrom(this.billingService.getFeeTypes());
      this.feeTypes.set(feeTypes);
    } catch (e) {
      // La notification d'erreur est déjà déclenchée par BillingService.handleError
    }
  }

  onClassChange(classId: string) {
    this.selectedClassId.set(classId);
    if (classId) {
      this.loadRoster(classId);
    } else {
      this.roster.set([]);
      this.balances.set([]);
    }
  }

  refresh() {
    if (this.selectedClassId()) {
      this.loadRoster(this.selectedClassId());
    }
  }

  private async loadRoster(classId: string) {
    this.isLoading.set(true);
    try {
      const roster = await firstValueFrom(this.academicService.getRoster(classId));
      this.roster.set(roster);
      await this.loadBalances(roster);
    } catch (e) {
      this.notificationService.error('Erreur lors du chargement des élèves de la classe.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadBalances(roster: StudentAssignment[] = this.roster()) {
    const studentIds = roster.map(student => student.studentId);
    try {
      const balances = await firstValueFrom(this.billingService.getBalancesBatch(studentIds));
      this.balances.set(balances);
    } catch (e) {
      // La notification d'erreur est déjà déclenchée par BillingService.handleError
    }
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    const studentId = event.row.id as string;
    switch (event.actionId) {
      case 'pay':
        this.openPaymentForm(studentId, event.row.title);
        break;
      case 'view':
        this.router.navigate(['/admin/registry/students', studentId]);
        break;
    }
  }

  private openPaymentForm(studentId: string, studentName: string) {
    const dialogRef = this.dialog.open(PaymentFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel',
      data: {studentId, studentName, feeTypes: this.feeTypes()}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadBalances();
    });
  }

  private formatAmount(value: number): string {
    return `${(value ?? 0).toLocaleString('fr-FR')} FCFA`;
  }
}
