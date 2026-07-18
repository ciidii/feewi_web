import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Info,
  LayoutGrid,
  LucideAngularModule,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  XCircle
} from 'lucide-angular';
import {EnrollmentPublicService} from '../../../../core/services/enrollment-public.service';
import {AdmissionSessionService} from '../../../../core/services/admission-session.service';
import {Admission, AdmissionBundleResponse} from '../../../../core/models/enrollment.model';
import {finalize} from 'rxjs';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../shared/components/badge/badge.component';
import {FwPublicHeaderComponent} from '../../../../shared/layout/public-header/public-header.component';
import {BlockLoaderComponent} from '../../../../shared/components/loader/block-loader.component';
import {FwDatePipe} from '../../../../shared/pipes/fw-date.pipe';
import {ConfirmDialogComponent} from '../../../../shared/components/confirm-dialog/confirm-dialog';

type TrackerMode = 'bundle' | 'single' | 'search';
type SearchTab  = 'code' | 'email';

@Component({
  selector: 'app-public-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule, MatDialogModule,
    FwButtonComponent, FwBadgeComponent, BlockLoaderComponent, FwDatePipe],
  templateUrl: './public-tracker.component.html',
  styleUrls: ['./public-tracker.component.scss']
})
export class PublicTrackerComponent implements OnInit {

  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private enrollment = inject(EnrollmentPublicService);
  private session = inject(AdmissionSessionService);
  private dialog  = inject(MatDialog);

  // ── Mode d'affichage ──────────────────────────────────────────────────────
  mode      = signal<TrackerMode>('search');
  searchTab = signal<SearchTab>('code');

  // ── Données ───────────────────────────────────────────────────────────────
  bundle            = signal<AdmissionBundleResponse | null>(null);
  selectedAdmission = signal<Admission | null>(null);   // enfant sélectionné dans la vue bundle
  admission         = signal<Admission | null>(null);   // mode single
  emailResults      = signal<Admission[]>([]);

  // ── Chargement / erreurs ──────────────────────────────────────────────────
  isLoading      = signal(false);
  isDeciding     = signal(false);
  isDeletingDraft = signal(false);
  error          = signal<string | null>(null);

  // ── Formulaires ───────────────────────────────────────────────────────────
  searchData = {reference: '', accessCode: ''};
  emailInput = '';

  // ── Computed ──────────────────────────────────────────────────────────────
  /** Liste des enfants du bundle, ou liste vide */
  admissions = computed(() => this.bundle()?.admissions ?? []);

  /** Vrai si l'enfant courant a au moins un doc obligatoire manquant */
  hasMissingDocs = computed(() => {
    const app = this.selectedAdmission() ?? this.admission();
    return app?.documents?.some(d => d.mandatory && d.status === 'MISSING') ?? false;
  });

  /** Code d'accès connu pour le dossier actuellement affiché (bundle, recherche par code, ou lien direct) */
  resolvedAccessCode = computed(() =>
    this.bundle()?.accessCode
    ?? this.route.snapshot.queryParamMap.get('accessCode')
    ?? (this.searchData.accessCode || null)
  );

  /** Vrai si tous les enfants du bundle sont en brouillon (suppression du dossier familial possible) */
  canDeleteBundle = computed(() =>
    this.admissions().length > 0 && this.admissions().every(a => a.status === 'DRAFT')
  );

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    const bundleId  = qp.get('bundleId');
    const accessCode = qp.get('accessCode');
    const routeRef  = this.route.snapshot.paramMap.get('id');

    if (bundleId && accessCode) {
      // Cas principal : retour après soumission ou lien direct bundle
      this.loadBundle(bundleId, accessCode);
    } else if (routeRef) {
      // Lien direct enfant : /tracker/ADM-2026-XXX?accessCode=...
      const code = accessCode || this.session.getSession()?.accessCode || '';
      if (code) this.loadSingle(routeRef, code);
      else this.mode.set('search');
    } else {
      // Vérifier session active (parent qui revient)
      const s = this.session.getSession();
      if (s?.bundleId && s?.accessCode) {
        this.loadBundle(s.bundleId, s.accessCode);
      } else {
        this.mode.set('search');
      }
    }
  }

  // ── Chargements ───────────────────────────────────────────────────────────

  loadBundle(bundleId: string, accessCode: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.enrollment.getBundle(bundleId, accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (b) => {
        this.bundle.set(b);
        this.mode.set('bundle');
        // Auto-sélectionner si un seul enfant
        if (b.admissions.length === 1) this.selectedAdmission.set(b.admissions[0]);
      },
      error: () => this.error.set('Dossier introuvable. Vérifiez le code d\'accès.')
    });
  }

  loadSingle(reference: string, accessCode: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.enrollment.trackAdmission(reference, accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (a) => { this.admission.set(a); this.mode.set('single'); },
      error: () => this.error.set('Référence ou code d\'accès incorrect.')
    });
  }

  // ── Recherche par référence ───────────────────────────────────────────────

  onSearchByCode() {
    if (!this.searchData.reference || !this.searchData.accessCode) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.enrollment.trackAdmission(this.searchData.reference, this.searchData.accessCode).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (a) => {
        this.admission.set(a);
        this.mode.set('single');
        this.router.navigate([], { queryParams: { ref: a.reference, accessCode: this.searchData.accessCode }, replaceUrl: true });
      },
      error: () => this.error.set('Aucun dossier trouvé avec cette référence et ce code.')
    });
  }

  // ── Recherche par email ───────────────────────────────────────────────────

  onSearchByEmail() {
    if (!this.emailInput.trim()) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.enrollment.getMyAdmissions(this.emailInput.trim()).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (list) => {
        this.emailResults.set(list);
        if (list.length === 0) this.error.set('Aucun dossier trouvé pour cet email.');
      },
      error: () => this.error.set('Erreur lors de la recherche.')
    });
  }

  selectEmailResult(a: Admission) {
    this.admission.set(a);
    this.mode.set('single');
    this.emailResults.set([]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  reset() {
    this.mode.set('search');
    this.bundle.set(null);
    this.admission.set(null);
    this.selectedAdmission.set(null);
    this.emailResults.set([]);
    this.error.set(null);
    this.router.navigate(['/admissions/tracker'], { replaceUrl: true });
  }

  reload() {
    const qp = this.route.snapshot.queryParamMap;
    const bundleId  = qp.get('bundleId');
    const accessCode = qp.get('accessCode');
    if (bundleId && accessCode) this.loadBundle(bundleId, accessCode);
    else if (this.admission()) this.loadSingle(this.admission()!.reference, this.searchData.accessCode);
  }

  // ── Décisions bundle (niveau famille) ────────────────────────────────────

  get bundleAccessCode(): string {
    return this.bundle()?.accessCode ?? this.route.snapshot.queryParamMap.get('accessCode') ?? '';
  }

  onConfirmAdmitted() {
    const b = this.bundle();
    if (!b) return;
    this.isDeciding.set(true);
    this.enrollment.confirmAdmitted(b.id, this.bundleAccessCode).pipe(
      finalize(() => this.isDeciding.set(false))
    ).subscribe({
      next: (updated) => this.bundle.set(updated),
      error: () => this.error.set('Erreur lors de la confirmation. Veuillez réessayer.')
    });
  }

  onCancelAll() {
    const b = this.bundle();
    if (!b) return;
    this.isDeciding.set(true);
    this.enrollment.cancelAll(b.id, this.bundleAccessCode).pipe(
      finalize(() => this.isDeciding.set(false))
    ).subscribe({
      next: (updated) => this.bundle.set(updated),
      error: () => this.error.set('Erreur lors de l\'annulation. Veuillez réessayer.')
    });
  }

  // ── Suppression de dossiers en brouillon ─────────────────────────────────

  onDeleteAdmission(app: Admission) {
    const accessCode = this.resolvedAccessCode();
    if (!accessCode) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer le brouillon',
        message: `Le dossier de ${app.identity?.firstName} ${app.identity?.lastName} sera définitivement supprimé. Cette action est irréversible.`,
        confirmLabel: 'Supprimer définitivement',
        type: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.isDeletingDraft.set(true);
      this.enrollment.deleteAdmission(app.id, accessCode).pipe(
        finalize(() => this.isDeletingDraft.set(false))
      ).subscribe({
        next: () => {
          if (this.mode() === 'bundle') {
            this.selectedAdmission.set(null);
            this.reload();
          } else {
            this.session.clearSession();
            this.reset();
          }
        }
      });
    });
  }

  onDeleteBundle() {
    const b = this.bundle();
    if (!b) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer tout le dossier',
        message: 'Le dossier familial et tous les enfants en brouillon seront définitivement supprimés. Cette action est irréversible et vous devrez recommencer une nouvelle demande.',
        confirmLabel: 'Supprimer définitivement',
        type: 'destructive'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.isDeletingDraft.set(true);
      this.enrollment.deleteBundle(b.id, this.bundleAccessCode).pipe(
        finalize(() => this.isDeletingDraft.set(false))
      ).subscribe({
        next: () => {
          this.session.clearSession();
          this.reset();
        }
      });
    });
  }

  hasMissingMandatoryDocs(documents: any[] | undefined): boolean {
    if (!documents) return false;
    return documents.some(d => d.mandatory && (d.status === 'MISSING' || d.status === 'REJECTED'));
  }

  docStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      MISSING: 'Manquant', UPLOADED: 'Déposé',
      PHYSICAL_RECEIVED: 'Reçu', RECEIVED: 'Reçu',
      VERIFIED: 'Vérifié', REJECTED: 'Refusé'
    };
    return labels[status] ?? status;
  }

  docStatusClass(status: string): string {
    if (status === 'MISSING') return 'doc-missing';
    if (status === 'REJECTED') return 'doc-rejected';
    if (['UPLOADED'].includes(status)) return 'doc-uploaded';
    return 'doc-ok';
  }

  // ── Icônes ────────────────────────────────────────────────────────────────
  readonly Clock = Clock; readonly CheckCircle = CheckCircle;
  readonly MessageSquare = MessageSquare; readonly Phone = Phone;
  readonly Mail = Mail; readonly FileText = FileText;
  readonly Info = Info; readonly ArrowLeft = ArrowLeft;
  readonly RefreshCw = RefreshCw; readonly Search = Search;
  readonly ArrowRight = ArrowRight; readonly ShieldCheck = ShieldCheck;
  readonly LayoutGrid = LayoutGrid; readonly Check = Check;
  readonly Sparkles = Sparkles; readonly XCircle = XCircle;
  readonly AlertTriangle = AlertTriangle; readonly ChevronRight = ChevronRight;
  readonly Users = Users; readonly Trash2 = Trash2;
}
