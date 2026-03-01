import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2, RefreshCcw } from 'lucide-angular';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {
  private loadingService = inject(LoadingService);

  isLoading = input.required<boolean>();
  fullscreen = input<boolean>(false);
  message = input<string>('');

  isSlow = this.loadingService.isSlowLoading;

  readonly Loader2 = Loader2;
  readonly RefreshCcw = RefreshCcw;

  refresh() {
    window.location.reload();
  }
}
