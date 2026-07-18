import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {LucideAngularModule, MapPinOff, Mail} from 'lucide-angular';
import {DevTenantSwitcherComponent} from '../../../../shared/components/dev-tenant-switcher/dev-tenant-switcher.component';
import {EnvironmentService} from '../../../../core/services/environment.service';

@Component({
  selector: 'app-tenant-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, DevTenantSwitcherComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div class="max-w-md w-full text-center space-y-8">
        <div class="relative inline-flex">
          <div class="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
            <lucide-icon [name]="MapPinOff" class="w-16 h-16"></lucide-icon>
          </div>
        </div>

        <div class="space-y-3">
          <h1 class="text-3xl font-display font-extrabold text-midnight tracking-tight">École introuvable</h1>
          <p class="text-slate-500 font-medium">
            L'adresse que vous avez saisie ne correspond à aucun établissement enregistré sur Feewi.
            Vérifiez le lien fourni par votre école ou contactez son secrétariat.
          </p>
        </div>

        <div class="flex flex-col gap-3 pt-4">
          <a href="mailto:support@feewi.com" class="flex items-center justify-center gap-2 h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
            <lucide-icon [name]="Mail" class="w-4 h-4"></lucide-icon>
            Contacter le support Feewi
          </a>
        </div>

        <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Feewi Education
        </p>
      </div>
    </div>

    <app-dev-tenant-switcher *ngIf="!envService.isProduction()" />
  `,
  styles: [`
    :host { display: block; }
    .font-display { font-family: 'Lexend', sans-serif; }
  `]
})
export class TenantNotFoundComponent {
  envService = inject(EnvironmentService);

  readonly MapPinOff = MapPinOff;
  readonly Mail = Mail;
}
