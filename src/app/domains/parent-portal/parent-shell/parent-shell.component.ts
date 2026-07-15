import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {LogOut, LucideAngularModule, School} from 'lucide-angular';
import {AuthService} from '../../../core/services/auth.service';

@Component({
  selector: 'app-parent-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LucideAngularModule],
  templateUrl: './parent-shell.component.html',
  styleUrl: './parent-shell.component.scss'
})
export class ParentShellComponent {
  private authService = inject(AuthService);

  readonly School = School;
  readonly LogOut = LogOut;

  currentUser = this.authService.currentUser;

  logout() {
    this.authService.logout();
  }
}
