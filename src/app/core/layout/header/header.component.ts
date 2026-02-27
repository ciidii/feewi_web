import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantContextService } from '../../services/tenant-context.service';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, Search, Grid, Bell, User, CalendarDays, ChevronDown, LogOut } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  tenantService = inject(TenantContextService);
  auth = inject(AuthService);

  readonly Search = Search;
  readonly Grid = Grid;
  readonly Bell = Bell;
  readonly User = User;
  readonly CalendarDays = CalendarDays;
  readonly ChevronDown = ChevronDown;
  readonly LogOut = LogOut;
}
