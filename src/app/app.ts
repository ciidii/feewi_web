import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SplashScreenComponent } from './shared/components/loader/splash-screen.component';
import { LoadingService } from './shared/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SplashScreenComponent],
  templateUrl: './app.html',
  encapsulation: ViewEncapsulation.None
})
export class App {
  protected readonly title = signal('feewi_web');
  loadingService = inject(LoadingService);
}
