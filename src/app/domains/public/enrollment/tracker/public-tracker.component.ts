import {Component, signal, computed, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Router, ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {
  LucideAngularModule,
  Clock, CheckCircle, MessageSquare, Phone, Mail, FileText,
  Info, ArrowLeft, RefreshCw, Search, ArrowRight, ShieldCheck,
  LayoutGrid, Check, Sparkles, XCircle, AlertTriangle, ChevronRight, Users
} from 'lucide-angular';
import {EnrollmentPublicService} from '../../../../core/services/enrollment-public.service';
import {AdmissionSessionService} from '../../../../core/services/admission-session.service';
import {Admission, AdmissionBundleResponse, DocumentStatus} from '../../../../core/models/enrollment.model';
import {BundleDecisionState} from '../../../../core/models/enrollment/entities';
import {finalize} from 'rxjs';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../shared/components/badge/badge.component';
import {FwPublicHeaderComponent} from '../../../../shared/layout/public-header/public-header.component';

type TrackerMode = 'bundle' | 'single' | 'search';
type SearchTab  = 'code' | 'email';

@Component({
  selector: 'app-public-tracker',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule,
            FwButtonComponent, FwBadgeComponent, FwPublicHeaderComponent],
  templateUrl: './public-tracker.component.html',
  styleUrls: ['./public-tracker.component.scss']
})
export class PublicTrackerComponent implements OnInit {

  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private enrollment = inject(EnrollmentPublicService);
  private session = inject(AdmissionSessionService);

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
    this.router.navigate(['/enrollment/tracker'], { replaceUrl: true });
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
  readonly Users = Users;
}
