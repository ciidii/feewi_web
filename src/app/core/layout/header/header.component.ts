import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Bell, CalendarDays, ChevronDown, LogOut, LucideAngularModule, Search, User} from 'lucide-angular';
import {AuthService} from '../../services/auth.service';
import {TenantContextService} from '../../services/tenant-context.service';
import {NavigationContextService} from '../../services/navigation-context.service';
import {LoadingService} from '../../../shared/services/loading.service';
import {MatMenuModule} from '@angular/material/menu';

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
  loadingService = inject(LoadingService);

  readonly Search = Search;
  readonly Bell = Bell;
  readonly User = User;
  readonly LogOut = LogOut;
  readonly CalendarDays = CalendarDays;
  readonly ChevronDown = ChevronDown;

  testLoader() {
    this.loadingService.start('page');
    setTimeout(() => this.loadingService.stop(), 3000);
  }

  openProfileDialog() {
    // Sera implémenté avec le composant de profil
    console.log('Open profile');
  }
}
