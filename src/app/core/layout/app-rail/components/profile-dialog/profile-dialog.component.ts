import {Component, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {ArrowRight, Building2, KeyRound, LucideAngularModule, Mail, Power, ShieldCheck, User, X} from 'lucide-angular';
import {AuthService} from '../../../../services/auth.service';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, LucideAngularModule],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss'
})
export class ProfileDialogComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<ProfileDialogComponent>);

  readonly User = User;
  readonly Mail = Mail;
  readonly Building2 = Building2;
  readonly ShieldCheck = ShieldCheck;
  readonly KeyRound = KeyRound;
  readonly Power = Power;
  readonly ArrowRight = ArrowRight;
  readonly X = X;

  readonly profile = computed(() => this.auth.currentUser());

  get initials(): string {
    const user = this.profile();
    if (!user) return '--';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  }

  formatRole(role: string): string {
    return role.replace('ROLE_', '').replace(/_/g, ' ');
  }

  close() {
    this.dialogRef.close();
  }

  viewFullProfile() {
    this.close();
    this.router.navigate(['/admin/account/profile']);
  }

  logout() {
    this.close();
    this.auth.logout();
  }
}
