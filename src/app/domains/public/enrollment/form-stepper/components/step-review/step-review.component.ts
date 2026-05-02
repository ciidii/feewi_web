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
      <!-- 🏛️ Institutional Header -->
      <div class="mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-midnight text-white rounded-2xl mb-5 shadow-lg shadow-midnight/10">
          <lucide-icon [name]="ClipboardCheck" [size]="28"></lucide-icon>
        </div>
        <h1 class="text-3xl font-display font-black text-midnight tracking-tight mb-2">Vérification finale</h1>
        <p class="text-base text-text-secondary font-medium max-w-lg leading-relaxed">
          Relisez attentivement l'ensemble des informations saisies avant de soumettre définitivement votre demande.
        </p>
      </div>

      <div class="space-y-8">

        <!-- Responsable légal -->
        <div class="p-8 rounded-[32px] border-2 border-border bg-white shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-12 h-12 rounded-2xl bg-surface-sunken text-midnight flex items-center justify-center shadow-sm">
              <lucide-icon [name]="Users" [size]="24"></lucide-icon>
            </div>
            <h3 class="font-display font-black text-midnight text-lg uppercase tracking-tight">Dossier Familial</h3>
          </div>
          
          <div class="grid grid-cols-2 gap-10">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary-alpha text-primary flex items-center justify-center shrink-0">
                <lucide-icon [name]="User" [size]="18"></lucide-icon>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-tertiary tracking-[0.15em] mb-1">Responsable Principal</p>
                <p class="font-bold text-midnight text-lg leading-tight">{{ family.primaryGuardian.firstName }} {{ family.primaryGuardian.lastName }}</p>
                <p class="text-xs text-text-secondary mt-2 font-semibold bg-surface-sunken px-2 py-1 rounded w-fit">Lien : {{ family.primaryGuardian.relation }}</p>
              </div>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center gap-4 text-base font-bold text-midnight bg-surface-sunken/50 p-3 rounded-xl border border-border/50">
                <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><lucide-icon [name]="Phone" [size]="16" class="text-primary"></lucide-icon></div>
                {{ family.primaryGuardian.phone }}
              </div>
              <div class="flex items-center gap-4 text-base font-bold text-midnight bg-surface-sunken/50 p-3 rounded-xl border border-border/50">
                <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><lucide-icon [name]="Mail" [size]="16" class="text-primary"></lucide-icon></div>
                <span class="truncate">{{ family.primaryGuardian.email || 'Non renseigné' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Un bloc par enfant -->
        <div *ngFor="let adm of admissions; let i = index"
             class="p-8 rounded-[32px] border-2 border-border bg-white shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-midnight text-white flex items-center justify-center shadow-lg shadow-midnight/10">
                <lucide-icon [name]="User" [size]="24"></lucide-icon>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-text-tertiary tracking-[0.15em] mb-0.5">Candidat {{ i + 1 }}</p>
                <h3 class="font-display font-black text-midnight text-xl tracking-tight">
                  {{ adm.identity.firstName }} {{ adm.identity.lastName }}
                </h3>
              </div>
            </div>
            <app-fw-badge [status]="'SUBMITTED'" labelOverride="Complet" size="sm"></app-fw-badge>
          </div>

          <div class="grid grid-cols-2 gap-10">
            <!-- Niveau & Services -->
            <div class="space-y-8">
              <div>
                <p class="text-[10px] font-black uppercase text-text-tertiary tracking-[0.1em] mb-3">Vœu d'inscription</p>
                <div class="inline-flex items-center gap-3 px-4 py-2 bg-primary-alpha/5 border border-primary-alpha rounded-xl font-black text-primary text-sm">
                  <lucide-icon [name]="Sparkles" [size]="14"></lucide-icon>
                  {{ levelName(adm) }}
                </div>
              </div>

              <div *ngIf="adm.subscriptions?.length">
                <p class="text-[10px] font-black uppercase text-text-tertiary tracking-[0.1em] mb-3">Options & Services</p>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let sub of adm.subscriptions"
                        class="px-3 py-1.5 bg-midnight text-white rounded-lg text-[10px] font-bold uppercase tracking-wide">
                    {{ sub.serviceCode }}<span *ngIf="sub.optionCode" class="opacity-60 ml-1">· {{ sub.optionCode }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Documents -->
            <div>
              <p class="text-[10px] font-black uppercase text-text-tertiary tracking-[0.1em] mb-3">Dossier numérique</p>
              <div class="space-y-2">
                <div *ngFor="let doc of adm.documents" class="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-sunken/80 border border-border/50">
                  <span class="text-xs font-bold text-midnight truncate pr-4">{{ doc.name }}</span>
                  <div class="flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
                       [class.bg-success]="isDocOk(doc.status)"
                       [class.text-white]="isDocOk(doc.status)"
                       [class.bg-error]="!isDocOk(doc.status)"
                       [class.text-white]="!isDocOk(doc.status)">
                    <lucide-icon [name]="isDocOk(doc.status) ? CheckCircle : ShieldAlert" [size]="14"></lucide-icon>
                  </div>
                </div>
                <p *ngIf="!adm.documents?.length" class="text-xs text-text-tertiary italic">Aucun document requis</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Consentement légal -->
      <div class="mt-16 p-10 bg-midnight rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-primary-alpha/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

        <div class="flex items-start gap-6 mb-10 relative z-1">
          <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 shadow-inner">
            <lucide-icon [name]="ShieldAlert" [size]="28" class="text-primary"></lucide-icon>
          </div>
          <div class="text-sm leading-relaxed opacity-90 font-medium">
            <h4 class="text-lg font-black uppercase tracking-tight mb-3">Certification sur l'honneur</h4>
            <div class="space-y-4 text-slate-300">
              <p *ngIf="legalText">{{ legalText }}</p>
              <p *ngIf="!legalText">
                Je certifie sur l'honneur l'exactitude des informations fournies dans ce formulaire. 
                Je comprends que toute fausse déclaration ou omission volontaire pourra entraîner l'annulation de la candidature de l'enfant auprès de l'établissement.
              </p>
            </div>
          </div>
        </div>

        <label class="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all group relative z-1">
          <div class="relative w-8 h-8 shrink-0">
            <input type="checkbox" [(ngModel)]="consent.checked"
                   class="peer absolute inset-0 opacity-0 cursor-pointer w-8 h-8 z-10">
            <div class="w-8 h-8 rounded-xl border-2 border-white/20 transition-all
                        peer-checked:bg-primary peer-checked:border-primary peer-checked:scale-110
                        flex items-center justify-center shadow-lg">
              <lucide-icon *ngIf="consent.checked" [name]="CheckCircle" [size]="18" class="text-white"></lucide-icon>
            </div>
          </div>
          <span class="text-base font-black uppercase tracking-tight text-white/90 group-hover:text-white">Je confirme la validité et l'exactitude de mon dossier</span>
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
