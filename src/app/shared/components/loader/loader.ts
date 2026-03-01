import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {
  isLoading = input.required<boolean>();
  fullscreen = input<boolean>(false);
  message = input<string>('');

  readonly Loader2 = Loader2;
}
