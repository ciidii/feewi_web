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
import {Permission, Role} from '../../../../../core/models/role.model';

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

  // Dictionnaires de traduction
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

  // États
  isLoading = this.identityService.loading;
  isInitialLoading = signal(true);
  isSaving = signal(false);
  selectedRoleId = signal<string | null>(null);
  unsavedChanges = signal<Set<string>>(new Set());

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

  // Groupes de permissions PBAC
  permissionGroups = signal<PermissionDomainGroup[]>([]);
  permissionQuery = signal('');

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
      roles: this.identityService.getRoles()
    }).pipe(
      finalize(() => this.isInitialLoading.set(false))
    ).subscribe({
      next: ({ permissions }) => {
        const groups = this.groupPermissionsToMatrix(permissions);
        this.permissionGroups.set(groups);

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

  private groupPermissionsToMatrix(apiPermissions: Permission[]): PermissionDomainGroup[] {
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
      const actionObj: PermissionAction = {
        id: p.name,
        actionCode: action,
        label: this.formatActionLabel(action),
        description: p.description,
        granted: false,
        icon: this.getSemanticIcon(action),
        variant: 'tertiary'
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
    return this.unsavedChanges().size > 0;
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
    this.syncPermissionsWithSelectedRole();
    this.unsavedChanges.set(new Set());
  }

  async deleteRole() {
    const role = this.selectedRole();
    if (!role || role.rawData.isSystemRole) return;
    // Logique de suppression à implémenter
  }

  private syncPermissionsWithSelectedRole() {
    const role = this.selectedRole();
    if (!role?.rawData?.permissions) return;

    const grantedPermissions = role.rawData.permissions;

    const updatedGroups = this.permissionGroups().map(group => ({
      ...group,
      resources: group.resources.map(res => {
        const updateAction = (act?: PermissionAction) => {
          if (!act) return undefined;
          const granted = grantedPermissions.includes(act.id);
          return { ...act, granted, variant: this.getSemanticVariant(act.actionCode, granted) };
        };
        return {
          ...res,
          read: updateAction(res.read),
          write: updateAction(res.write),
          delete: updateAction(res.delete),
          specials: res.specials?.map(act => updateAction(act)!)
        };
      })
    }));

    this.permissionGroups.set(updatedGroups);
  }

  onPermissionToggle(permissionId: string, granted: boolean) {
    const updatedGroups = this.permissionGroups().map(group => ({
      ...group,
      resources: group.resources.map(res => {
        const updateAction = (act?: PermissionAction) => {
          if (!act || act.id !== permissionId) return act;
          return { ...act, granted, variant: this.getSemanticVariant(act.actionCode, granted) };
        };
        return {
          ...res,
          read: updateAction(res.read),
          write: updateAction(res.write),
          delete: updateAction(res.delete),
          specials: res.specials?.map(act => updateAction(act) as PermissionAction)
        };
      })
    }));
    this.permissionGroups.set(updatedGroups);

    const updated = new Set(this.unsavedChanges());
    if (updated.has(permissionId)) updated.delete(permissionId);
    else updated.add(permissionId);
    this.unsavedChanges.set(updated);
  }

  savePermissions() {
    const role = this.selectedRole();
    if (!role?.rawData?.id || !this.hasUnsavedChanges()) return;

    this.isSaving.set(true);

    const allActions = this.permissionGroups().flatMap(g =>
      g.resources.flatMap(r => [r.read, r.write, r.delete, ...(r.specials || [])].filter(Boolean) as PermissionAction[])
    );
    const grantedIds = allActions.filter(a => a.granted).map(a => a.id);

    this.identityService.updateRole(role.rawData.id, { permissions: grantedIds }).pipe(
      switchMap(() => this.identityService.getRoles()),
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.unsavedChanges.set(new Set());
        this.notificationService.success('Permissions mises à jour avec succès.');
        this.syncPermissionsWithSelectedRole();
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
  protected readonly Search = Search;

}
