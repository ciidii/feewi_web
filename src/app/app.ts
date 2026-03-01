import {Component, inject, signal, ViewEncapsulation} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader';
import {LoadingService} from './shared/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.html',
  encapsulation: ViewEncapsulation.None
})
export class App {
  protected readonly title = signal('feewi_web');
  loadingService = inject(LoadingService);
}
