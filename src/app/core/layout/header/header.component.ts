import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, User, LogOut, Search, CalendarDays, ChevronDown, Sun, Moon, Monitor, Maximize, Minimize, Settings } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { TenantContextService } from '../../services/tenant-context.service';
import { NavigationContextService } from '../../services/navigation-context.service';
import { UiPreferenceService } from '../../../shared/services/ui-preference.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatMenuModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  auth = inject(AuthService);
  tenantService = inject(TenantContextService);
  contextService = inject(NavigationContextService);
  uiService = inject(UiPreferenceService);

  readonly Search = Search;
  readonly Bell = Bell;
  readonly User = User;
  readonly LogOut = LogOut;
  readonly CalendarDays = CalendarDays;
  readonly ChevronDown = ChevronDown;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly Monitor = Monitor;
  readonly Maximize = Maximize;
  readonly Minimize = Minimize;
  readonly Settings = Settings;

  openProfileDialog() {
    // Sera implémenté avec le composant de profil
    console.log('Open profile');
  }
}
