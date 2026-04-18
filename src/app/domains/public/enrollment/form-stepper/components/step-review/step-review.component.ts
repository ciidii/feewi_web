import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckCircle, FileText, LayoutGrid, LucideAngularModule, User, Users, ClipboardCheck, Mail, Phone, ShieldAlert, Sparkles } from 'lucide-angular';
import { Admission } from '../../../../../../core/models/enrollment/entities';
import { FwBadgeComponent } from '../../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, FwBadgeComponent],
  template: `
    <div class="animate-fade">
      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-alpha text-primary rounded-xl mb-4">
          <lucide-icon [name]="ClipboardCheck" [size]="24"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight">Vérification finale</h1>
        <p class="text-sm text-text-secondary font-medium mt-2 max-w-lg">
          Veuillez relire attentivement l'ensemble des informations saisies avant de soumettre définitivement votre dossier.
        </p>
      </div>

      <div class="space-y-6">

        <!-- Responsable légal -->
        <div class="p-6 rounded-2xl border-2 border-border bg-white shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-surface-sunken text-midnight flex items-center justify-center">
              <lucide-icon [name]="Users" [size]="20"></lucide-icon>
            </div>
            <h3 class="font-display font-black text-midnight text-base uppercase tracking-tight">Dossier Familial</h3>
          </div>
          <div class="grid grid-cols-2 gap-8">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
                <lucide-icon [name]="User" [size]="14" class="text-text-tertiary"></lucide-icon>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-1">Responsable Principal</p>
                <p class="font-bold text-midnight leading-tight">{{ family.primaryGuardian.firstName }} {{ family.primaryGuardian.lastName }}</p>
                <p class="text-xs text-text-secondary mt-1 font-medium italic">Lien : {{ family.primaryGuardian.relation }}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-3 text-sm font-bold text-midnight">
                <lucide-icon [name]="Phone" [size]="14" class="text-primary"></lucide-icon>
                {{ family.primaryGuardian.phone }}
              </div>
              <div class="flex items-center gap-3 text-sm font-bold text-midnight">
                <lucide-icon [name]="Mail" [size]="14" class="text-primary"></lucide-icon>
                {{ family.primaryGuardian.email || 'Non renseigné' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Un bloc par enfant -->
        <div *ngFor="let adm of admissions; let i = index"
             class="p-6 rounded-2xl border-2 border-border bg-white shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <lucide-icon [name]="User" [size]="20"></lucide-icon>
              </div>
              <div>
                <h3 class="font-display font-black text-midnight text-base uppercase tracking-tight">
                  Élève {{ i + 1 }}
                </h3>
                <p class="text-sm font-bold text-primary">{{ adm.identity.firstName }} {{ adm.identity.lastName }}</p>
              </div>
            </div>
            <app-fw-badge [status]="'SUBMITTED'" size="xs"></app-fw-badge>
          </div>

          <div class="grid grid-cols-2 gap-8">
            <!-- Niveau & Services -->
            <div class="space-y-6">
              <div>
                <p class="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-2">Inscription</p>
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-sunken rounded-lg font-black text-midnight text-xs">
                  <lucide-icon [name]="Sparkles" [size]="12" class="text-primary"></lucide-icon>
                  {{ levelName(adm) }}
                </div>
              </div>

              <div *ngIf="adm.subscriptions?.length">
                <p class="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-2">Options & Services</p>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let sub of adm.subscriptions"
                        class="px-2.5 py-1 bg-primary-alpha/5 border border-primary-alpha rounded-lg text-[10px] font-black uppercase tracking-tight text-primary">
                    {{ sub.serviceCode }}<span *ngIf="sub.optionCode"> · {{ sub.optionCode }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Documents -->
            <div>
              <p class="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-2">Pièces Justificatives</p>
              <div class="space-y-1.5">
                <div *ngFor="let doc of adm.documents" class="flex items-center justify-between p-2 rounded-lg bg-surface-sunken">
                  <span class="text-xs font-bold text-text-secondary truncate pr-4">{{ doc.name }}</span>
                  <div class="flex items-center justify-center w-5 h-5 rounded-full"
                       [class.bg-success-border]="isDocOk(doc.status)"
                       [class.text-success]="isDocOk(doc.status)"
                       [class.bg-error-border]="!isDocOk(doc.status)"
                       [class.text-error]="!isDocOk(doc.status)">
                    <lucide-icon [name]="isDocOk(doc.status) ? CheckCircle : ShieldAlert" [size]="12"></lucide-icon>
                  </div>
                </div>
                <p *ngIf="!adm.documents?.length" class="text-xs text-text-tertiary italic">Aucun document requis</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Consentement légal -->
      <div class="mt-12 p-8 bg-midnight rounded-3xl text-white shadow-xl">
        <div class="flex items-start gap-4 mb-8">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <lucide-icon [name]="ShieldAlert" [size]="20" class="text-primary"></lucide-icon>
          </div>
          <div class="text-xs leading-relaxed opacity-80 font-medium">
            <p *ngIf="legalText" class="mb-4">{{ legalText }}</p>
            <p *ngIf="!legalText">
              Je certifie sur l'honneur l'exactitude des informations fournies dans ce formulaire. 
              Je comprends que toute fausse déclaration ou omission volontaire pourra entraîner l'annulation de la candidature de l'enfant auprès de l'établissement.
            </p>
          </div>
        </div>

        <label class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group">
          <div class="relative w-6 h-6 shrink-0">
            <input type="checkbox" [(ngModel)]="consent.checked"
                   class="peer absolute inset-0 opacity-0 cursor-pointer w-6 h-6">
            <div class="w-6 h-6 rounded-lg border-2 border-white/20 transition-all
                        peer-checked:bg-primary peer-checked:border-primary
                        flex items-center justify-center">
              <lucide-icon *ngIf="consent.checked" [name]="CheckCircle" [size]="14" class="text-white"></lucide-icon>
            </div>
          </div>
          <span class="text-sm font-black uppercase tracking-tight">Je confirme la validité de mon dossier familial</span>
        </label>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StepReviewComponent {
  @Input() family: any;
  @Input() admissions: Admission[] = [];
  @Input() allLevels: any[] = [];
  @Input() legalText = '';
  @Input() consent: { checked: boolean } = { checked: false };

  levelName(adm: Admission): string {
    return this.allLevels.find(l => l.id === adm.schooling?.levelId)?.name ?? adm.schooling?.levelId ?? '';
  }

  isDocOk(status: string): boolean {
    return ['UPLOADED', 'RECEIVED', 'VERIFIED'].includes(status);
  }

  readonly Users = Users;
  readonly User = User;
  readonly LayoutGrid = LayoutGrid;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly ClipboardCheck = ClipboardCheck;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly ShieldAlert = ShieldAlert;
  readonly Sparkles = Sparkles;
}
