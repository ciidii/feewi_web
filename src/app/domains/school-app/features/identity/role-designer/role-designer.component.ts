import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {firstValueFrom} from 'rxjs';
import {
  ChevronRight,
  Edit3,
  Eye,
  FilePlus,
  Info,
  Key,
  Loader2,
  LucideAngularModule,
  Maximize2,
  Plus,
  Save, Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap
} from 'lucide-angular';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {IdentityService} from '../../../../../core/services/identity.service';
import {RoleFormComponent} from './components/role-form/role-form.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {ButtonVariant, FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FormsModule} from '@angular/forms';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';

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
  special?: PermissionAction;
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
  private dialog = inject(MatDialog);

  // Dictionnaires de traduction
  private readonly DOMAIN_LABELS: Record<string, string> = {
    'identity': 'Administration & Sécurité',
    'academic': 'Pédagogie & Structure',
    'enrollment': 'Inscriptions & Scolarité',
    'finance': 'Gestion Financière',
    'notification': 'Communication & Alertes'
  };

  private readonly RESOURCE_LABELS: Record<string, string> = {
    'school': 'Établissement (SaaS)',
    'user': 'Utilisateurs & Staff',
    'role': 'Rôles & Permissions',
    'audit': 'Journal d\'audit',
    'structure': 'Cycles & Niveaux',
    'subject': 'Matières & Syllabus',
    'year': 'Calendrier Académique',
    'class': 'Classes Physiques',
    'teaching': 'Affectation Enseignants',
    'assignment': 'Affectation Élèves',
    'exam': 'Examens & Notes',
    'attendance': 'Présences (Appel)',
    'admission': 'Dossiers d\'admission',
    'session': 'Sessions d\'inscription'
  };

  private readonly ACTION_LABELS: Record<string, string> = {
    'read': 'Lecture',
    'write': 'Écriture',
    'delete': 'Suppression',
    'lifecycle': 'Vie',
    'manage': 'Gestion',
    'create': 'Ajout'
  };

  // États
  isLoading = this.identityService.loading;
  isInitialLoading = signal(true);
  isSaving = signal(false);
  selectedRoleId = signal<string | null>(null);
  unsavedChanges = signal<Set<string>>(new Set());

  // Icônes
  readonly ShieldCheck = ShieldCheck;
  readonly Shield = Shield;
  readonly Save = Save;
  readonly Plus = Plus;
  readonly ChevronRight = ChevronRight;
  readonly Loader2 = Loader2;
  readonly Users = Users;
  readonly Key = Key;
  readonly Info = Info;
  readonly Sparkles = Sparkles;
  readonly Maximize2 = Maximize2;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Edit3 = Edit3;
  readonly Zap = Zap;
  readonly SettingsIcon = Settings;
  readonly FilePlus = FilePlus;

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

  async loadInitialData() {
    this.isInitialLoading.set(true);
    try {
      // Charger les permissions d'abord pour construire la matrice
      await this.loadPermissions();
      // Ensuite charger les rôles (ce qui va déclencher la sélection et la synchro)
      await this.loadRoles();
    } finally {
      this.isInitialLoading.set(false);
    }
  }

  async loadPermissions() {
    try {
      const permissions = await firstValueFrom(this.identityService.getAvailablePermissions());
      const groups = this.groupPermissionsToMatrix(permissions);
      this.permissionGroups.set(groups);
    } catch (err) {
      console.error('Failed to load permissions', err);
    }
  }

  private groupPermissionsToMatrix(apiPermissions: any[]): PermissionDomainGroup[] {
    const domainMap = new Map<string, Map<string, PermissionResourceRow>>();

    apiPermissions.forEach(p => {
      if (!p.name) return;
      const parts = p.name.split(':');
      let domain, resource, action;

      if (parts.length === 2) {
        domain = parts[0];
        resource = parts[0]; // On utilise le domaine comme ressource
        action = parts[1];
      } else if (parts.length >= 3) {
        domain = parts[0];
        resource = parts[1];
        action = parts[2];
      } else {
        return; // Format inconnu
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

      // Assigner au bon slot de la matrice
      if (action === 'read') row.read = actionObj;
      else if (['write', 'create', 'add'].includes(action)) row.write = actionObj;
      else if (['delete', 'remove'].includes(action)) row.delete = actionObj;
      else {
        // Si le slot spécial est déjà pris, on évite d'écraser (très rare)
        if (!row.special) row.special = actionObj;
      }
    });

    return Array.from(domainMap.entries()).map(([domainCode, resourceMap]) => ({
      domainCode,
      domainName: this.DOMAIN_LABELS[domainCode] || domainCode.toUpperCase(),
      resources: Array.from(resourceMap.values()).sort((a, b) => a.resourceName.localeCompare(b.resourceName))
    })).sort((a, b) => a.domainName.localeCompare(b.domainName));
  }

  private formatActionLabel(action: string): string {
    switch (action) {
      case 'read': return 'Lire';
      case 'write': return 'Modifier';
      case 'create': return 'Ajouter';
      case 'delete': return 'Supprimer';
      case 'lifecycle': return 'Cycle';
      case 'manage': return 'Gérer';
      default: return action;
    }
  }

  private getSemanticIcon(action: string): any {
    switch (action) {
      case 'read': return Eye;
      case 'write': return Edit3;
      case 'create': return FilePlus;
      case 'delete': return Trash2;
      case 'lifecycle': return Zap;
      case 'manage': return Settings;
      default: return Shield;
    }
  }

  private getSemanticVariant(action: string, granted: boolean): ButtonVariant {
    if (!granted) return 'tertiary'; // État "Éteint"
    switch (action) {
      case 'read': return 'secondary'; // Gris bleu soutenu
      case 'write':
      case 'create': return 'primary'; // Bleu Feewi
      case 'delete': return 'danger';  // Rouge
      case 'lifecycle':
      case 'manage': return 'accent';  // Ambre
      default: return 'primary';
    }
  }

  // ===========================================
  // MÉTHODES UTILITAIRES
  // ===========================================

  formatRoleName(roleName: string): string {
    return roleName.replace('ROLE_', '').replace(/_/g, ' ');
  }

  hasUnsavedChanges(): boolean {
    return this.unsavedChanges().size > 0;
  }

  // ===========================================
  // GESTION DES RÔLES
  // ===========================================

  async loadRoles() {
    await firstValueFrom(this.identityService.getRoles());
    const firstRole = this.roles()[0];
    if (firstRole && !this.selectedRoleId()) {
      this.selectRole(firstRole.id);
    }
  }

  openAddRoleForm() {
    const dialogRef = this.dialog.open(RoleFormComponent, {
      width: '560px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRoles();
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
    console.log('Suppression du rôle:', role.name);
  }

  // ===========================================
  // GESTION DES PERMISSIONS
  // ===========================================

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
          special: updateAction(res.special)
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
          special: updateAction(res.special)
        };
      })
    }));
    this.permissionGroups.set(updatedGroups);

    const updated = new Set(this.unsavedChanges());
    if (updated.has(permissionId)) updated.delete(permissionId);
    else updated.add(permissionId);
    this.unsavedChanges.set(updated);
  }

  // ===========================================
  // SAUVEGARDE
  // ===========================================

  async savePermissions() {
    const role = this.selectedRole();
    if (!role?.rawData?.id || !this.hasUnsavedChanges()) return;

    this.isSaving.set(true);

    const allActions = this.permissionGroups().flatMap(g =>
      g.resources.flatMap(r => [r.read, r.write, r.delete, r.special].filter(Boolean) as PermissionAction[])
    );
    const grantedIds = allActions.filter(a => a.granted).map(a => a.id);

    try {
      await firstValueFrom(this.identityService.updateRole(role.rawData.id, {
        permissions: grantedIds
      }));
      await this.loadRoles();
      this.unsavedChanges.set(new Set());
    } catch (err) {
      console.error('❌ Erreur de sauvegarde', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected readonly Search = Search;
}
