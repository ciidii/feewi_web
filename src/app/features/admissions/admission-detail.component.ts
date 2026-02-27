import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle, Printer, Download, User, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatButtonModule, RouterModule],
  template: `
    <div class="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">

      <!-- Barre de Pilotage (Sticky Header) -->
      <header class="flex items-center justify-between h-16 bg-white border-b border-border-subtle px-6 sticky top-0 z-30 shadow-sm">
        <div class="flex items-center gap-4">
          <button routerLink="/admissions" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ice text-slate-medium transition-colors" title="Retour à la liste">
            <lucide-icon [name]="ArrowLeft" class="w-5 h-5"></lucide-icon>
          </button>
          <div class="h-6 w-[1px] bg-border-subtle"></div>
          <div class="flex flex-col">
            <h2 class="text-sm font-bold text-midnight tracking-tight">{{ student().name }}</h2>
            <span class="text-[10px] font-bold text-slate-medium uppercase tracking-widest">Dossier #{{ student().id }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions Atomiques -->
          <button class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 active:scale-95">
            <lucide-icon [name]="CheckCircle" class="w-4 h-4"></lucide-icon>
            Valider le dossier
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all active:scale-95">
            <lucide-icon [name]="XCircle" class="w-4 h-4"></lucide-icon>
            Rejeter
          </button>

          <div class="h-6 w-[1px] bg-border-subtle mx-2"></div>

          <button class="w-9 h-9 flex items-center justify-center rounded-xl border border-border-subtle hover:bg-ice text-slate-medium transition-all">
            <lucide-icon [name]="Printer" class="w-4 h-4"></lucide-icon>
          </button>

          <!-- Navigation Séquentielle -->
          <div class="flex items-center bg-slate-100 rounded-xl p-1 ml-2">
            <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-medium transition-all disabled:opacity-30" title="Précédent">
              <lucide-icon [name]="ChevronLeft" class="w-4 h-4"></lucide-icon>
            </button>
            <span class="px-3 text-[10px] font-bold text-slate-medium uppercase">5 sur 42</span>
            <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-medium transition-all" title="Suivant">
              <lucide-icon [name]="ChevronRight" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>
      </header>

      <!-- Contenu du Dossier -->
      <div class="flex-1 overflow-y-auto p-8 bg-ice/30">
        <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Colonne Gauche : Infos Principales -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Section : État Civil -->
            <section class="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex justify-between items-center">
                <h3 class="text-xs font-bold uppercase tracking-widest text-midnight flex items-center gap-2">
                  <lucide-icon [name]="User" class="w-4 h-4 text-primary"></lucide-icon>
                  État Civil & Coordonnées
                </h3>
                <button class="text-[10px] font-bold text-primary uppercase hover:underline">Modifier</button>
              </div>
              <div class="p-6 grid grid-cols-2 gap-y-6 gap-x-8">
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-medium uppercase tracking-tighter">Nom complet</p>
                  <p class="text-sm font-semibold text-midnight">{{ student().name }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-medium uppercase tracking-tighter">Date de naissance</p>
                  <p class="text-sm font-semibold text-midnight">12 Mai 2012 (12 ans)</p>
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-medium uppercase tracking-tighter">Email parents</p>
                  <p class="text-sm font-semibold text-midnight flex items-center gap-2">
                    <lucide-icon [name]="Mail" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                    parents.dupont&#64;email.com
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-medium uppercase tracking-tighter">Téléphone</p>
                  <p class="text-sm font-semibold text-midnight flex items-center gap-2">
                    <lucide-icon [name]="Phone" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                    +221 77 123 45 67
                  </p>
                </div>
                <div class="col-span-2 space-y-1">
                  <p class="text-[10px] font-bold text-slate-medium uppercase tracking-tighter">Adresse</p>
                  <p class="text-sm font-semibold text-midnight flex items-center gap-2">
                    <lucide-icon [name]="MapPin" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                    Villa 123, Sacré-Cœur 3, Dakar
                  </p>
                </div>
              </div>
            </section>

            <!-- Section : Documents (Grid) -->
            <section class="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-border-subtle bg-slate-50/50">
                <h3 class="text-xs font-bold uppercase tracking-widest text-midnight flex items-center gap-2">
                  <lucide-icon [name]="FileText" class="w-4 h-4 text-primary"></lucide-icon>
                  Pièces Jointes
                </h3>
              </div>
              <div class="p-4 grid grid-cols-2 gap-4">
                <div *ngFor="let doc of documents" class="flex items-center justify-between p-3 border border-border-subtle rounded-xl hover:bg-ice transition-colors group cursor-pointer">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center">
                      <lucide-icon [name]="FileText" class="w-5 h-5"></lucide-icon>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-midnight truncate w-32">{{ doc.name }}</span>
                      <span class="text-[9px] text-slate-medium uppercase font-bold">{{ doc.size }} • PDF</span>
                    </div>
                  </div>
                  <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white text-slate-medium opacity-0 group-hover:opacity-100 transition-all">
                    <lucide-icon [name]="Download" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>
            </section>
          </div>

          <!-- Colonne Droite : Statut & Finance -->
          <div class="space-y-6">
            <section class="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
              <div class="p-6 text-center space-y-4">
                <div class="inline-flex px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  En vérification
                </div>
                <div class="space-y-1">
                   <p class="text-[10px] font-bold text-slate-medium uppercase tracking-widest">Classe demandée</p>
                   <p class="text-xl font-display font-bold text-midnight">6ème A</p>
                </div>
              </div>
              <div class="border-t border-border-subtle bg-slate-50/50 p-4">
                <div class="flex justify-between items-center mb-4">
                   <span class="text-[10px] font-bold text-slate-medium uppercase">Frais d'inscription</span>
                   <span class="text-sm font-bold text-midnight">75.000 FCFA</span>
                </div>
                <div class="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <lucide-icon [name]="CreditCard" class="w-5 h-5 text-green-600"></lucide-icon>
                  <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-green-700 uppercase">Paiement Reçu</span>
                    <span class="text-[9px] text-green-600 font-medium">Via Orange Money • 24/02/2024</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Timeline simplifiée -->
            <section class="p-2">
              <h4 class="text-[10px] font-bold text-slate-medium uppercase tracking-widest mb-4 px-2">Historique du dossier</h4>
              <div class="space-y-4 border-l-2 border-slate-100 ml-4 pl-6 relative">
                <div *ngFor="let step of timeline" class="relative">
                  <div class="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-300"></div>
                  <p class="text-xs font-bold text-midnight">{{ step.action }}</p>
                  <p class="text-[10px] text-slate-medium">{{ step.date }} • par {{ step.user }}</p>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None
})
export class AdmissionDetailComponent {
  student = signal({ id: 'ADM-2024-001', name: 'Jean Dupont' });

  documents = [
    { name: 'Extrait de naissance', size: '1.2 MB' },
    { name: 'Bulletins CM2', size: '2.4 MB' },
    { name: 'Certificat de scolarité', size: '800 KB' },
    { name: "Photo d'identité", size: '500 KB' }
  ];

  timeline = [
    { action: 'Dossier soumis', date: '20 Fév 2024, 14:30', user: 'Parent' },
    { action: 'Paiement vérifié', date: '22 Fév 2024, 09:15', user: 'Comptable' },
    { action: 'Ouverture du dossier', date: '24 Fév 2024, 10:00', user: 'Admin' }
  ];

  readonly ArrowLeft = ArrowLeft;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Printer = Printer;
  readonly Download = Download;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly FileText = FileText;
  readonly CreditCard = CreditCard;
}
