import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet} from '@angular/router';
import {HeaderComponent} from '../header/header.component';
import {AppRailComponent} from '../app-rail/app-rail.component';
import {SidebarComponent} from '../sidebar/sidebar.component';
import {PageProgressComponent} from '../../../shared/components/loader/page-progress.component';
import {LoadingService} from '../../../shared/services/loading.service';
import {filter} from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    AppRailComponent,
    SidebarComponent,
    PageProgressComponent
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  protected loadingService = inject(LoadingService);
  private router = inject(Router);

  constructor() {
    // Gestion automatique du loader de page lors de la navigation
    this.router.events.pipe(
      filter(event =>
        event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      )
    ).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingService.start('page');
      } else {
        this.loadingService.stop();
      }
    });
  }
}
