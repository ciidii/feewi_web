import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantContextService } from '../../services/tenant-context.service';
import { AuthService } from '../../services/auth.service';
import { NavigationContextService } from '../../services/navigation-context.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule, Search, Grid, Bell, User, CalendarDays, ChevronDown, LogOut } from 'lucide-angular';
import { ProfileDialogComponent } from './components/profile-dialog/profile-dialog.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private dialog = inject(MatDialog);
  tenantService = inject(TenantContextService);
  auth = inject(AuthService);
  contextService = inject(NavigationContextService);

  readonly Search = Search;
  readonly Grid = Grid;
  readonly Bell = Bell;
  readonly User = User;
  readonly CalendarDays = CalendarDays;
  readonly ChevronDown = ChevronDown;
  readonly LogOut = LogOut;

  openProfileDialog() {
    this.dialog.open(ProfileDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      panelClass: 'profile-dialog-panel'
    });
  }
}
