import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {forkJoin, finalize, switchMap} from 'rxjs';
import {
  ChevronRight,
  Edit3,
  Eye,
  FilePlus,
  Info,
  Key,
  LucideAngularModule,
  Plus,
  Save,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap,
  Settings
} from 'lucide-angular';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {IdentityService} from '../../../../../core/services/identity.service';
import {RoleFormComponent} from './components/role-form/role-form.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {ButtonVariant, FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FormsModule} from '@angular/forms';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';
import {NotificationService} from '../../../../../shared/services/notification.service';
import {Permission, PermissionCapability, RiskLevel, Role} from '../../../../../core/models/role.model';

export interface PermissionAction {
  id: string; // academic:structure:read
  actionCode: string; // read
  label: string; // Consulter
  description?: string;
  granted: boolean;
  icon: any;
  variant: ButtonVariant;
}

export interface PermissionResourceRow {
  resourceCode: string; // structure
  resourceName: string; // Structure Éducative
  // Slots fixes pour la matrice
  read?: PermissionAction;
  write?: PermissionAction;
  delete?: PermissionAction;
  /** Actions non-CRUD (validate, supervise, manage...) — plusieurs possibles par ressource. */
  specials?: PermissionAction[];
}

export interface PermissionDomainGroup {
  domainCode: string; // academic
  domainName: string; // Pédagogie & Structure
  resources: PermissionResourceRow[];
}

export interface CapabilityRow extends PermissionCapability {
  granted: boolean;
}

export interface CapabilityCategoryGroup {
  categoryCode: string;
  categoryLabel: string;
  capabilities: CapabilityRow[];
}

export interface CategorySummary {
  categoryCode: string;
  categoryLabel: string;
  grantedCount: number;
  totalCount: number;
  hasCritical: boolean;
}

@Component({
  selector: 'app-role-designer',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatButtonModule,
    FwPageShellComponent,
    FwButtonComponent,
    FormsModule,
    SkeletonComponent
  ],
  templateUrl: './role-designer.component.html',
  styleUrls: ['./role-designer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RoleDesignerComponent implements OnInit {
  private identityService = inject(IdentityService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Dictionnaires de traduction (vue technique)
  private readonly DOMAIN_LABELS: Record<string, string> = {
    'identity': 'Administration & Sécurité',
    'academic': 'Pédagogie & Structure',
    'enrollment': 'Admissions & Inscriptions',
    'finance': 'Gestion Financière',
    'notification': 'Communication & Alertes',
    'student': 'Registre & Scolarité'
  };

  private readonly RESOURCE_LABELS: Record<string, string> = {
    'school': 'Établissement (SaaS)',
    'saas:school': 'Gestion des Écoles (SaaS)',
    'saas:audit': 'Audit Plateforme (SaaS)',
    'user': 'Utilisateurs & Staff',
    'role': 'Rôles & Permissions',
    'audit': 'Journal d\'audit',
    'structure': 'Cycles & Niveaux',
    'subject': 'Matières & Syllabus',
    'year': 'Calendrier Académique',
    'class': 'Classes Physiques',
    'teaching': 'Affectation Enseignants',
    'assignment': 'Affectation Élèves',
    'roster': 'Roster de Classe',
    'exam': 'Examens & Notes',
    'attendance': 'Présences (Appel)',
    'admission': 'Gestion des Candidatures',
    'dashboard': 'Tableau de Bord Admissions',
    'config': 'Paramètres du Portail',
    'registry': 'Fiches Élèves',
    'discipline': 'Discipline & Suivi'
  };

  private readonly ACTION_LABELS: Record<string, string> = {
    'read': 'Lire',
    'write': 'Modifier',
    'delete': 'Supprimer',
    'lifecycle': 'Vie',
    'manage': 'Gérer',
    'create': 'Ajouter',
    'validate': 'Valider',
    'list': 'Lister',
    'view': 'Consulter',
    'submit': 'Soumettre',
    'verify': 'Vérifier',
    'assess': 'Évaluer',
    'decide': 'Décider',
    'cancel': 'Annuler',
    'confirm-payment': 'Confirmer paiement',
    'deliver': 'Remettre'
  };

  private readonly RISK_LABELS: Record<RiskLevel, string> = {
    'NORMAL': 'Standard',
    'SENSITIVE': 'Sensible',
    'CRITICAL': 'Critique'
  };

  // États
  isLoading = this.identityService.loading;
  isInitialLoading = signal(true);
  isSaving = signal(false);
  selectedRoleId = signal<string | null>(null);
  showAdvancedView = signal(false);
  showAllCategories = signal(false);

  // Rôles transformés
  roles = computed(() => {
    const apiRoles = this.identityService.roles();
    return apiRoles.map(role => ({
      id: role.id || role.name,
      name: this.formatRoleName(role.name),
      icon: role.isSystemRole ? ShieldCheck : Shield,
      memberCount: role.memberCount || 0,
      rawData: role
    }));
  });

  // Rôle sélectionné
  selectedRole = computed(() => {
    const currentRoles = this.roles();
    if (currentRoles.length === 0) return null;
    return currentRoles.find(r => r.id === this.selectedRoleId()) || currentRoles[0];
  });

  isReadOnly = computed(() => this.selectedRole()?.rawData?.isSystemRole || false);

  // Catalogues bruts (chargés une seule fois)
  permissionCatalog = signal<Permission[]>([]);
  capabilityCatalog = signal<PermissionCapability[]>([]);
  permissionQuery = signal('');

  // Source de vérité unique pour l'état d'édition d'un rôle : ensemble des codes de
  // permission accordés. La vue métier et la vue technique lisent/écrivent toutes les
  // deux ce même ensemble, ce qui garantit qu'elles restent synchronisées.
  grantedPermissionCodes = signal<Set<string>>(new Set());
  private originalPermissionCodes = signal<Set<string>>(new Set());

  // Vue métier : capacités groupées par catégorie business
  capabilityGroups = computed(() =>
    this.buildCapabilityGroups(this.capabilityCatalog(), this.grantedPermissionCodes())
  );

  filteredCapabilityGroups = computed(() => {
    const query = this.permissionQuery().toLowerCase();
    const groups = this.capabilityGroups();
    if (!query) return groups;

    return groups.map(group => ({
      ...group,
      capabilities: group.capabilities.filter(cap =>
        cap.label.toLowerCase().includes(query) || cap.code.toLowerCase().includes(query)
      )
    })).filter(group => group.capabilities.length > 0);
  });

  categorySummary = computed<CategorySummary[]>(() =>
    this.capabilityGroups()
      .map(group => {
        const granted = group.capabilities.filter(c => c.granted);
        return {
          categoryCode: group.categoryCode,
          categoryLabel: group.categoryLabel,
          grantedCount: granted.length,
          totalCount: group.capabilities.length,
          hasCritical: granted.some(c => c.riskLevel === 'CRITICAL')
        };
      })
      .filter(summary => summary.grantedCount > 0)
  );

  // Recadrage par scope : par défaut, seules les catégories où le rôle a au moins une
  // capacité accordée sont affichées — évite de noyer un rôle scopé (ex: Comptable)
  // sous les 6 catégories métier alors qu'il n'en concerne réellement que 2-3.
  visibleCapabilityGroups = computed(() => {
    const groups = this.filteredCapabilityGroups();
    const hasAnyGrant = this.categorySummary().length > 0;
    if (this.showAllCategories() || !hasAnyGrant) return groups;
    return groups.filter(group => group.capabilities.some(c => c.granted));
  });

  hiddenCategoryCount = computed(() =>
    this.filteredCapabilityGroups().length - this.visibleCapabilityGroups().length
  );

  // Vue technique : matrice domaine × ressource × CRUD
  permissionGroups = computed(() =>
    this.buildPermissionMatrix(this.permissionCatalog(), this.grantedPermissionCodes())
  );

  filteredPermissionGroups = computed(() => {
    const query = this.permissionQuery().toLowerCase();
    const groups = this.permissionGroups();
    if (!query) return groups;

    return groups.map(group => ({
      ...group,
      resources: group.resources.map(res => ({
        ...res
      })).filter(res =>
        res.resourceName.toLowerCase().includes(query) ||
        res.resourceCode.toLowerCase().includes(query)
      )
    })).filter(group => group.resources.length > 0);
  });

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.isInitialLoading.set(true);

    forkJoin({
      permissions: this.identityService.getAvailablePermissions(),
      capabilities: this.identityService.getCapabilities(),
      roles: this.identityService.getRoles()
    }).pipe(
      finalize(() => this.isInitialLoading.set(false))
    ).subscribe({
      next: ({ permissions, capabilities }) => {
        this.permissionCatalog.set(permissions);
        this.capabilityCatalog.set(capabilities);

        const firstRole = this.roles()[0];
        if (firstRole && !this.selectedRoleId()) {
          this.selectRole(firstRole.id);
        }
      },
      error: (err) => {
        console.error('Failed to load initial data', err);
        this.notificationService.error('Impossible de charger les données de sécurité.');
      }
    });
  }

  private buildCapabilityGroups(catalog: PermissionCapability[], grantedSet: Set<string>): CapabilityCategoryGroup[] {
    const categoryMap = new Map<string, CapabilityCategoryGroup>();

    catalog.forEach(capability => {
      if (!categoryMap.has(capability.categoryCode)) {
        categoryMap.set(capability.categoryCode, {
          categoryCode: capability.categoryCode,
          categoryLabel: capability.categoryLabel,
          capabilities: []
        });
      }

      const granted = capability.permissions.length > 0 && capability.permissions.every(p => grantedSet.has(p));
      categoryMap.get(capability.categoryCode)!.capabilities.push({ ...capability, granted });
    });

    return Array.from(categoryMap.values());
  }

  private buildPermissionMatrix(apiPermissions: Permission[], grantedSet: Set<string>): PermissionDomainGroup[] {
    const domainMap = new Map<string, Map<string, PermissionResourceRow>>();

    apiPermissions.forEach(p => {
      if (!p.name) return;
      const parts = p.name.split(':');
      let domain, resource, action;

      if (parts.length === 2) {
        domain = parts[0];
        resource = parts[0];
        action = parts[1];
      } else if (parts.length === 3) {
        domain = parts[0];
        resource = parts[1];
        action = parts[2];
      } else if (parts.length === 4) {
        domain = parts[0];
        resource = `${parts[1]}:${parts[2]}`;
        action = parts[3];
      } else {
        return;
      }

      if (!domainMap.has(domain)) domainMap.set(domain, new Map());
      const resourceMap = domainMap.get(domain)!;

      if (!resourceMap.has(resource)) {
        resourceMap.set(resource, {
          resourceCode: resource,
          resourceName: this.RESOURCE_LABELS[resource] || resource.toUpperCase()
        });
      }

      const row = resourceMap.get(resource)!;
      const granted = grantedSet.has(p.name);
      const actionObj: PermissionAction = {
        id: p.name,
        actionCode: action,
        label: this.formatActionLabel(action),
        description: p.description,
        granted,
        icon: this.getSemanticIcon(action),
        variant: this.getSemanticVariant(action, granted)
      };

      if (['read', 'list', 'view'].includes(action)) {
        row.read = actionObj;
      } else if (['write', 'create', 'add', 'submit', 'assess'].includes(action)) {
        row.write = actionObj;
      } else if (['delete', 'remove', 'cancel'].includes(action)) {
        row.delete = actionObj;
      } else {
        if (!row.specials) row.specials = [];
        row.specials.push(actionObj);
      }
    });

    return Array.from(domainMap.entries()).map(([domainCode, resourceMap]) => ({
      domainCode,
      domainName: this.DOMAIN_LABELS[domainCode] || domainCode.toUpperCase(),
      resources: Array.from(resourceMap.values()).sort((a, b) => a.resourceName.localeCompare(b.resourceName))
    })).sort((a, b) => a.domainName.localeCompare(b.domainName));
  }

  private formatActionLabel(action: string): string {
    return this.ACTION_LABELS[action] || action;
  }

  riskLabel(risk: RiskLevel): string {
    return this.RISK_LABELS[risk] || risk;
  }

  riskClass(risk: RiskLevel): string {
    return 'risk-' + risk.toLowerCase();
  }

  private getSemanticIcon(action: string): any {
    switch (action) {
      case 'read':
      case 'list':
      case 'view': return Eye;
      case 'write':
      case 'submit':
      case 'assess': return Edit3;
      case 'create': return FilePlus;
      case 'delete':
      case 'cancel': return Trash2;
      case 'lifecycle': return Zap;
      case 'manage': return Settings;
      case 'validate':
      case 'verify':
      case 'decide': return ShieldCheck;
      default: return Shield;
    }
  }

  private getSemanticVariant(action: string, granted: boolean): ButtonVariant {
    if (!granted) return 'tertiary';
    switch (action) {
      case 'read':
      case 'list':
      case 'view': return 'secondary';
      case 'write':
      case 'create':
      case 'submit':
      case 'assess': return 'primary';
      case 'delete':
      case 'cancel': return 'danger';
      case 'lifecycle':
      case 'manage':
      case 'validate':
      case 'verify':
      case 'decide': return 'accent';
      default: return 'primary';
    }
  }

  formatRoleName(roleName: string): string {
    return roleName.replace('ROLE_', '').replace(/_/g, ' ');
  }

  hasUnsavedChanges(): boolean {
    const granted = this.grantedPermissionCodes();
    const original = this.originalPermissionCodes();
    if (granted.size !== original.size) return true;
    for (const code of granted) {
      if (!original.has(code)) return true;
    }
    return false;
  }

  openAddRoleForm() {
    const dialogRef = this.dialog.open(RoleFormComponent, {
      width: '560px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.identityService.getRoles().subscribe();
    });
  }

  selectRole(id: string) {
    this.selectedRoleId.set(id);
    const role = this.roles().find(r => r.id === id);
    const grantedPermissions = role?.rawData?.permissions || [];
    this.grantedPermissionCodes.set(new Set(grantedPermissions));
    this.originalPermissionCodes.set(new Set(grantedPermissions));
    this.showAllCategories.set(false);
  }

  async deleteRole() {
    const role = this.selectedRole();
    if (!role || role.rawData.isSystemRole) return;
    // Logique de suppression à implémenter
  }

  private toggleCodes(codes: string[], granted: boolean) {
    this.grantedPermissionCodes.update(set => {
      const next = new Set(set);
      codes.forEach(code => granted ? next.add(code) : next.delete(code));
      return next;
    });
  }

  onPermissionToggle(permissionId: string, granted: boolean) {
    this.toggleCodes([permissionId], granted);
  }

  onCapabilityToggle(capability: PermissionCapability, granted: boolean) {
    this.toggleCodes(capability.permissions, granted);
  }

  savePermissions() {
    const role = this.selectedRole();
    if (!role?.rawData?.id || !this.hasUnsavedChanges()) return;

    this.isSaving.set(true);

    const grantedIds = Array.from(this.grantedPermissionCodes());

    this.identityService.updateRole(role.rawData.id, { permissions: grantedIds }).pipe(
      switchMap(() => this.identityService.getRoles()),
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.originalPermissionCodes.set(new Set(this.grantedPermissionCodes()));
        this.notificationService.success('Permissions mises à jour avec succès.');
      },
      error: (err) => {
        console.error('❌ Erreur de sauvegarde', err);
        this.notificationService.error('Échec de la sauvegarde des permissions.');
      }
    });
  }

  // Icônes
  readonly ShieldCheck = ShieldCheck;
  readonly Shield = Shield;
  readonly Save = Save;
  readonly Plus = Plus;
  readonly ChevronRight = ChevronRight;
  readonly Users = Users;
  readonly Key = Key;
  readonly Info = Info;
  readonly Sparkles = Sparkles;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Edit3 = Edit3;
  readonly Zap = Zap;
  readonly Settings = Settings;
  readonly Settings2 = Settings2;
  protected readonly Search = Search;

}
