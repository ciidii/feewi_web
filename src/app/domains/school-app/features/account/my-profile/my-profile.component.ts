import {Component, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Building2, KeyRound, Mail, Phone, ShieldCheck, User} from 'lucide-angular';
import {LucideAngularModule} from 'lucide-angular';
import {AuthService} from '../../../../../core/services/auth.service';
import {TenantContextService} from '../../../../../core/services/tenant-context.service';
import {FwPageShellComponent} from '../../../../../shared/components/page-shell/page-shell.component';
import {FwInfoCardComponent} from '../../../../../shared/components/info-card/info-card.component';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwPageShellComponent, FwInfoCardComponent],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent {
  private auth = inject(AuthService);
  private tenantService = inject(TenantContextService);

  readonly User = User;
  readonly Mail = Mail;
  readonly Building2 = Building2;
  readonly ShieldCheck = ShieldCheck;
  readonly KeyRound = KeyRound;
  readonly Phone = Phone;

  readonly profile = computed(() => this.auth.currentUser());
  readonly tenantName = computed(() => this.tenantService.activeTenant()?.name || 'Non renseigné');

  get fullName(): string {
    const user = this.profile();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  get primaryRoleLabel(): string {
    const user = this.profile();
    return this.formatRole(user?.roles?.[0] || '');
  }

  formatRole(role: string): string {
    return role.replace('ROLE_', '').replace(/_/g, ' ');
  }

  formatStaffType(type: string): string {
    switch (type) {
      case 'TEACHER': return 'Enseignant';
      case 'ADMINISTRATION': return 'Administration';
      case 'SUPPORT': return 'Support';
      default: return 'Autre';
    }
  }
}
