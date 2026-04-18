import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckCircle, CircleAlert, Plus, LucideAngularModule, Pencil, User, Users, Sparkles } from 'lucide-angular';
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
      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-alpha text-primary rounded-xl mb-4">
          <lucide-icon [name]="Users" [size]="24"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight">Dossiers des enfants</h1>
        <p class="text-sm text-text-secondary font-medium mt-2 max-w-lg">
          Complétez les informations pour chaque enfant. Une fois tous les dossiers prêts, vous pourrez soumettre l'ensemble de votre demande.
        </p>
      </div>

      <!-- Liste des enfants -->
      <div class="space-y-4 mb-8">
        <div *ngFor="let adm of admissions"
             class="group flex items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-all hover:border-primary-alpha hover:shadow-md bg-white"
             [class.border-success-border]="isReady(adm)"
             [class.bg-success-bg]="isReady(adm)"
             [class.border-border]="!isReady(adm)">

          <!-- Identité enfant -->
          <div class="flex items-center gap-4 min-w-0">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                 [class.bg-success-border]="isReady(adm)"
                 [class.text-success]="isReady(adm)"
                 [class.bg-surface-sunken]="!isReady(adm)"
                 [class.text-text-tertiary]="!isReady(adm)">
              <lucide-icon [name]="User" [size]="20"></lucide-icon>
            </div>
            <div class="min-w-0">
              <p class="font-bold text-midnight truncate leading-none mb-1">
                {{ adm.identity.firstName }} {{ adm.identity.lastName }}
              </p>
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-black uppercase text-text-tertiary tracking-widest">{{ levelName(adm) }}</span>
                <app-fw-badge [status]="isReady(adm) ? 'SUBMITTED' : 'DRAFT'" size="xs"></app-fw-badge>
              </div>
            </div>
          </div>

          <!-- Action -->
          <app-fw-button 
            (click)="editChild.emit(adm)"
            variant="secondary"
            size="sm"
            [icon]="isReady(adm) ? Pencil : Plus"
          >
            {{ isReady(adm) ? 'Modifier' : 'Compléter' }}
          </app-fw-button>
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
}
