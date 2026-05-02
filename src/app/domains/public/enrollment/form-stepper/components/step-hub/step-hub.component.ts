import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CheckCircle,
  CircleAlert,
  Plus,
  LucideAngularModule,
  Pencil,
  User,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-angular';
import { Admission } from '../../../../../../core/models/enrollment/entities';
import { FwButtonComponent } from '../../../../../../shared/components/button/button.component';
import { FwBadgeComponent } from '../../../../../../shared/components/badge/badge.component';
import { FwEmptyStateComponent } from '../../../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-step-hub',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FwButtonComponent, FwBadgeComponent, FwEmptyStateComponent],
  template: `
    <div class="animate-fade">
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="Users" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">Dossiers des enfants</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          Complétez les informations pour chaque enfant. Une fois tous les dossiers prêts, vous pourrez soumettre l'ensemble de votre demande.
        </p>
      </div>

      <!-- Liste des enfants -->
      <div class="space-y-4 mb-10">
        <div *ngFor="let adm of admissions"
             class="group flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-[32px] border-2 transition-all hover:shadow-lg bg-white"
             [class.border-success-border]="isReady(adm)"
             [class.bg-success-bg/30]="isReady(adm)"
             [class.border-border]="!isReady(adm)">

          <!-- Identité enfant -->
          <div class="flex items-center gap-5 min-w-0 w-full sm:w-auto">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
                 [class.bg-success-border]="isReady(adm)"
                 [class.text-success]="isReady(adm)"
                 [class.bg-surface-sunken]="!isReady(adm)"
                 [class.text-text-tertiary]="!isReady(adm)">
              <lucide-icon [name]="User" [size]="28"></lucide-icon>
            </div>
            <div class="min-w-0">
              <p class="font-black text-midnight text-xl truncate leading-tight mb-1">
                {{ adm.identity.firstName }} {{ adm.identity.lastName }}
              </p>
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-black uppercase text-text-tertiary tracking-widest">{{ levelName(adm) }}</span>
                <app-fw-badge [status]="isReady(adm) ? 'SUBMITTED' : 'DRAFT'"
                              [labelOverride]="isReady(adm) ? 'Prêt' : 'Incomplet'"
                              size="xs"></app-fw-badge>              </div>
            </div>
          </div>

          <!-- Action -->
          <div class="w-full sm:w-auto">
            <app-fw-button
              (click)="editChild.emit(adm)"
              [variant]="isReady(adm) ? 'secondary' : 'primary'"
              size="md"
              [icon]="isReady(adm) ? Pencil : ArrowRight"
              class="w-full"
            >
              {{ isReady(adm) ? 'Modifier' : 'Compléter' }}
            </app-fw-button>
          </div>
        </div>

        <!-- État vide -->
        <app-fw-empty-state
          *ngIf="!admissions.length"
          [icon]="User"
          title="Aucun enfant ajouté"
          description="Commencez par ajouter le premier enfant de votre fratrie."
          ctaLabel="Ajouter un enfant"
          (ctaClick)="addChild.emit()"
        ></app-fw-empty-state>
      </div>

      <!-- Actions globales -->
      <div *ngIf="admissions.length > 0" class="space-y-6 pt-6 border-t border-border">
        <app-fw-button
          (click)="addChild.emit()"
          variant="ghost"
          [icon]="Plus"
          class="w-full"
        >
          Ajouter un autre enfant
        </app-fw-button>

        <!-- Warning si incomplet -->
        <div *ngIf="hasIncomplete()" class="bg-warning-bg border border-warning-border p-4 rounded-xl flex gap-3 items-center">
          <lucide-icon [name]="CircleAlert" [size]="18" class="text-warning"></lucide-icon>
          <p class="text-xs font-bold text-warning">
            Certains dossiers ne sont pas encore prêts pour la soumission.
          </p>
        </div>

        <!-- Bouton final -->
        <app-fw-button
          (click)="submitAll.emit()"
          [disabled]="hasIncomplete() || !admissions.length"
          variant="primary"
          size="lg"
          [icon]="Sparkles"
          class="w-full"
        >
          Valider et finaliser l'inscription ({{ admissions.length }})
        </app-fw-button>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StepHubComponent {
  @Input() admissions: Admission[] = [];
  @Input() allLevels: any[] = [];
  @Output() editChild  = new EventEmitter<Admission>();
  @Output() addChild   = new EventEmitter<void>();
  @Output() submitAll  = new EventEmitter<void>();

  isReady(adm: Admission): boolean {
    const mandatoryDocs = adm.documents?.filter(d => d.mandatory) ?? [];
    if (mandatoryDocs.length === 0) return !!adm.identity?.firstName;

    return mandatoryDocs.every(d =>
      d.status === 'UPLOADED' ||
      d.status === 'RECEIVED' ||
      d.status === 'VERIFIED'
    );
  }

  hasIncomplete(): boolean {
    return this.admissions.some(a => !this.isReady(a));
  }

  levelName(adm: Admission): string {
    return this.allLevels.find(l => l.id === adm.schooling?.levelId)?.name ?? adm.schooling?.levelId ?? '';
  }

  readonly User = User;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
  readonly CircleAlert = CircleAlert;
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Sparkles = Sparkles;
  protected readonly ArrowRight = ArrowRight;
}
