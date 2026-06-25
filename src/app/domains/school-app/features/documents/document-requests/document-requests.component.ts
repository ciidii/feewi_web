import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {debounceTime, distinctUntilChanged, forkJoin, of, Subject, takeUntil} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {
  CheckCircle,
  Clock,
  FileText,
  LucideAngularModule,
  Plus,
  Search,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-angular';

import {DocumentRequestService} from '../../../../../core/services/document-request.service';
import {StudentRegistryService} from '../../../../../core/services/student-registry.service';
import {AuthService} from '../../../../../core/services/auth.service';
import {DocumentRequest, DocumentType} from '../../../../../core/models/document.model';
import {StudentSummary} from '../../../../../core/models/student.model';

import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';
import {FwTabsComponent, FwTab} from '../../../../../shared/components/tabs/tabs.component';

@Component({
  selector: 'app-document-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    FwPageShellComponent,
    FwButtonComponent,
    FwBadgeComponent,
    FwTabsComponent
  ],
  templateUrl: './document-requests.component.html',
  styleUrl: './document-requests.component.scss'
})
export class DocumentRequestsComponent implements OnInit, OnDestroy {
  private documentRequestService = inject(DocumentRequestService);
  private studentService = inject(StudentRegistryService);
  private authService = inject(AuthService);

  // --- Icons ---
  readonly Plus = Plus;
  readonly Search = Search;
  readonly X = X;
  readonly FileText = FileText;
  readonly Clock = Clock;
  readonly ShieldCheck = ShieldCheck;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;

  readonly documentTypeLabels: Record<DocumentType, string> = {
    CERTIFICAT_SCOLARITE: 'Certificat de scolarité',
    RELEVE_NOTES: 'Relevé de notes',
    ATTESTATION_PAIEMENT: 'Attestation de paiement'
  };

  // --- Permissions ---
  readonly canManage = computed(() => this.authService.hasPermission('document:request:manage'));
  readonly canValidate = computed(() => this.authService.hasPermission('document:request:validate'));
  readonly canSubmit = computed(() => this.authService.hasPermission('document:request:submit'));

  readonly tabs = computed<FwTab[]>(() => [
    {id: 'secretariat', label: 'À vérifier', icon: this.Clock, count: this.pendingRequests().length, disabled: !this.canManage()},
    {id: 'direction', label: 'À valider', icon: this.ShieldCheck, count: this.eligibleRequests().length, disabled: !this.canValidate()}
  ]);
  readonly activeTab = signal<'secretariat' | 'direction'>('secretariat');

  // --- Data ---
  readonly pendingRequests = signal<DocumentRequest[]>([]);
  readonly eligibleRequests = signal<DocumentRequest[]>([]);
  readonly isLoading = signal(false);
  readonly studentNames = signal<Record<string, string>>({});

  // --- New request form ---
  readonly showNewRequestForm = signal(false);
  readonly searchQuery = signal('');
  readonly searchResults = signal<StudentSummary[]>([]);
  readonly selectedStudent = signal<StudentSummary | null>(null);
  readonly selectedDocumentType = signal<DocumentType>('CERTIFICAT_SCOLARITE');
  readonly isSubmitting = signal(false);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.activeTab.set(this.canManage() ? 'secretariat' : 'direction');
    this.loadAll();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => this.performSearch(query));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAll() {
    if (this.canManage()) this.loadPending();
    if (this.canValidate()) this.loadEligible();
  }

  loadPending() {
    this.isLoading.set(true);
    this.documentRequestService.listRequests('PENDING').subscribe({
      next: (data) => {
        this.pendingRequests.set(data);
        this.resolveStudentNames(data);
      },
      complete: () => this.isLoading.set(false)
    });
  }

  loadEligible() {
    this.documentRequestService.listRequests('ELIGIBLE').subscribe(data => {
      this.eligibleRequests.set(data);
      this.resolveStudentNames(data);
    });
  }

  /** Résout les noms d'élèves pour l'affichage (document-engine-service ne connaît que les UUID). */
  private resolveStudentNames(requests: DocumentRequest[]) {
    const known = this.studentNames();
    const unknownIds = [...new Set(requests.map(r => r.studentId))].filter(id => !known[id]);
    if (unknownIds.length === 0) return;

    forkJoin(unknownIds.map(id =>
      this.studentService.getStudentById(id).pipe(catchError(() => of(null)))
    )).subscribe(students => {
      const updated = {...this.studentNames()};
      students.forEach((s, i) => {
        if (s) updated[unknownIds[i]] = `${s.firstName} ${s.lastName}`;
      });
      this.studentNames.set(updated);
    });
  }

  onTabChange(tabId: string) {
    this.activeTab.set(tabId as 'secretariat' | 'direction');
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.studentService.getStudents(query).subscribe(page => this.searchResults.set(page.content));
  }

  selectStudent(student: StudentSummary) {
    this.selectedStudent.set(student);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  submitNewRequest() {
    const student = this.selectedStudent();
    if (!student) return;

    const requestedBy = this.authService.currentUser()?.email ?? '';
    this.isSubmitting.set(true);
    this.documentRequestService.submitRequest({
      studentId: student.id,
      documentType: this.selectedDocumentType(),
      requestedBy
    }).subscribe({
      next: () => {
        this.showNewRequestForm.set(false);
        this.selectedStudent.set(null);
        this.loadPending();
      },
      complete: () => this.isSubmitting.set(false)
    });
  }

  markEligible(request: DocumentRequest) {
    this.documentRequestService.checkEligibility(request.id, true).subscribe(() => this.loadPending());
  }

  markIneligible(request: DocumentRequest) {
    const reason = window.prompt('Motif de non-éligibilité :');
    if (reason === null || reason.trim() === '') return;
    this.documentRequestService.checkEligibility(request.id, false, reason).subscribe(() => this.loadPending());
  }

  approveRequest(request: DocumentRequest) {
    this.documentRequestService.approve(request.id).subscribe(() => this.loadEligible());
  }

  rejectRequest(request: DocumentRequest) {
    const reason = window.prompt('Motif de refus :');
    if (reason === null || reason.trim() === '') return;
    this.documentRequestService.reject(request.id, reason).subscribe(() => this.loadEligible());
  }

  studentLabel(studentId: string): string {
    return this.studentNames()[studentId] || studentId;
  }
}
