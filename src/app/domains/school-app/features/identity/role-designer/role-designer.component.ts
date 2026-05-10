import {Component, computed, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule} from '@angular/common';
import {firstValueFrom} from 'rxjs';
import {
  ChevronRight,
  Info,
  Key,
  Loader2,
  LucideAngularModule,
  Maximize2,
  Plus,
  Save, Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users
} from 'lucide-angular';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {IdentityService} from '../../../../../core/services/identity.service';
import {RoleFormComponent} from './components/role-form/role-form.component';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwButtonComponent} from '../../../../../shared/components/button/button.component';
import {FormsModule} from '@angular/forms';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';

export interface Permission {
  id: string;
  label: string;
  description: string;
  granted: boolean;
  isSystemRole?: boolean;
  dependencies?: string[];
}

export interface PermissionGroup {
  category: string;
  permissions: Permission[];
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

  // États
  isLoading = this.identityService.loading;
  isInitialLoading = signal(true); // Pour le skeleton screen
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

  // Groupes de permissions dynamiques
  permissionGroups = signal<PermissionGroup[]>([]);
  permissionQuery = signal('');

  filteredPermissionGroups = computed(() => {
    const query = this.permissionQuery().toLowerCase();
    if (!query) return this.permissionGroups();

    return this.permissionGroups().map(group => ({
      ...group,
      permissions: group.permissions.filter(p =>
        p.label.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
      )
    })).filter(group => group.permissions.length > 0);
  });

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.isInitialLoading.set(true);
    try {
      await Promise.all([
        this.loadRoles(),
        this.loadPermissions()
      ]);
    } finally {
      this.isInitialLoading.set(false);
    }
  }

  async loadPermissions() {
    try {
      const permissions = await firstValueFrom(this.identityService.getAvailablePermissions());
      const groups = this.groupPermissions(permissions);
      this.permissionGroups.set(groups);
    } catch (err) {
      console.error('Failed to load permissions', err);
    }
  }

  private groupPermissions(apiPermissions: any[]): PermissionGroup[] {
    const groupsMap = new Map<string, Permission[]>();

    apiPermissions.forEach(p => {
      const category = this.inferCategory(p.name);
      if (!groupsMap.has(category)) {
        groupsMap.set(category, []);
      }
      groupsMap.get(category)?.push({
        id: p.name, // L'ID pour le toggle est le nom technique (ex: student:read)
        label: this.formatPermissionLabel(p.name),
        description: p.description,
        granted: false
      });
    });

    return Array.from(groupsMap.entries()).map(([category, permissions]) => ({
      category,
      permissions
    }));
  }

  private inferCategory(name: string): string {
    const prefix = name.split(':')[0];
    switch (prefix) {
      case 'student': return 'Scolarité & Workflow';
      case 'admission': return 'Inscriptions';
      case 'finance': return 'Gestion Financière';
      case 'user':
      case 'audit':
      case 'role':
      case 'permission': return 'Système & Sécurité';
      default: return 'Autres';
    }
  }

  private formatPermissionLabel(name: string): string {
    const suffix = name.split(':')[1] || name;
    return suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/_/g, ' ');
  }

  // ===========================================
  // MÉTHODES UTILITAIRES
  // ===========================================

  formatRoleName(roleName: string): string {
    return roleName.replace('ROLE_', '').replace(/_/g, ' ');
  }

  getTotalPermissions(): number {
    return this.permissionGroups().reduce((acc, g) => acc + g.permissions.length, 0);
  }

  getGrantedPermissionsCount(): number {
    return this.permissionGroups().reduce(
      (acc, g) => acc + g.permissions.filter(p => p.granted).length,
      0
    );
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
    
    // Pour l'instant, on se contente d'un log. La suppression sera raccordée à l'API.
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
      permissions: group.permissions.map(p => ({
        ...p,
        granted: grantedPermissions.includes(p.id)
      }))
    }));

    this.permissionGroups.set(updatedGroups);
  }

  onPermissionToggle(permissionId: string, granted: boolean) {
    // Mettre à jour l'état local
    const updatedGroups = this.permissionGroups().map(group => ({
      ...group,
      permissions: group.permissions.map(p =>
        p.id === permissionId ? {...p, granted} : p
      )
    }));
    this.permissionGroups.set(updatedGroups);

    // Marquer comme modifié
    const updated = new Set(this.unsavedChanges());
    updated.add(permissionId);
    this.unsavedChanges.set(updated);

    // Gérer les dépendances si nécessaire
    this.handleDependencies(permissionId, granted);
  }

  private handleDependencies(permissionId: string, granted: boolean) {
    if (!granted) return;

    const permission = this.findPermission(permissionId);
    if (permission?.dependencies) {
      const updatedGroups = this.permissionGroups().map(group => ({
        ...group,
        permissions: group.permissions.map(p =>
          permission.dependencies?.includes(p.id) ? {...p, granted: true} : p
        )
      }));
      this.permissionGroups.set(updatedGroups);
    }
  }

  private findPermission(id: string): Permission | undefined {
    for (const group of this.permissionGroups()) {
      const found = group.permissions.find(p => p.id === id);
      if (found) return found;
    }
    return undefined;
  }

  expandAllGroups() {
    console.log('Expand all groups');
  }

  // ===========================================
  // SAUVEGARDE
  // ===========================================

  async savePermissions() {
    const role = this.selectedRole();
    if (!role?.rawData?.id || !this.hasUnsavedChanges()) return;

    this.isSaving.set(true);

    const allPermissions = this.permissionGroups().flatMap(g => g.permissions);
    const grantedIds = allPermissions.filter(p => p.granted).map(p => p.id);

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
