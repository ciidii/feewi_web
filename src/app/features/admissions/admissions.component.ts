import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmartDataTableComponent, TableRow, TabItem } from '../../shared/components/smart-data-table.component';
import { LucideAngularModule, Filter, Download, Layers, Clock, ShieldCheck, UserCheck } from 'lucide-angular';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [CommonModule, SmartDataTableComponent, LucideAngularModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Page Header -->
      <header class="flex justify-between items-end">
        <div class="space-y-1">
          <h1 class="text-3xl font-display font-bold text-midnight tracking-tight">Dossiers d'Admissions</h1>
          <p class="text-sm text-slate-medium font-medium">Gestion du workflow des nouvelles inscriptions • 2024-2025</p>
        </div>
        
        <div class="flex gap-3">
          <button class="flex items-center gap-2 px-5 py-2.5 bg-white border border-border-subtle rounded-xl text-[13px] font-bold text-slate-medium hover:bg-ice hover:text-midnight transition-all hover:shadow-sm active:scale-95">
            <lucide-icon [name]="Filter" class="w-4 h-4"></lucide-icon>
            Filtrer la vue
          </button>
          <button class="flex items-center gap-2 px-5 py-2.5 bg-white border border-border-subtle rounded-xl text-[13px] font-bold text-slate-medium hover:bg-ice hover:text-midnight transition-all hover:shadow-sm active:scale-95">
            <lucide-icon [name]="Download" class="w-4 h-4"></lucide-icon>
            Exporter (CSV)
          </button>
        </div>
      </header>

      <!-- Table Component -->
      <app-smart-data-table
        [data]="admissions()"
        [tabs]="admissionTabs"
        [activeTab]="activeTab()"
        [total]="totalAdmissions()"
        (onTabChange)="onTabChange($event)"
        (onView)="viewDetails($event)"
      ></app-smart-data-table>
    </div>
  `,
  encapsulation: ViewEncapsulation.None
})
export class AdmissionsComponent {
  private router = inject(Router);

  readonly Filter = Filter;
  readonly Download = Download;

  activeTab = signal('Tous');
  totalAdmissions = signal(142);

  admissionTabs: TabItem[] = [
    { label: 'Tous', icon: Layers, count: 142 },
    { label: 'En attente', icon: Clock, count: 24 },
    { label: 'Vérifiés', icon: ShieldCheck, count: 86 },
    { label: 'Validés', icon: UserCheck, count: 32 }
  ];

  admissions = signal<TableRow[]>([
    {
      id: 1,
      title: 'Jean Dupont',
      subtitle: 'Niveau : 6ème A • Dossier #ADM-2024-001',
      avatarLabel: 'JD',
      date: 'Aujourd\'hui',
      badges: [{ label: 'Paiement OK', class: 'success' }, { label: 'Action requise', class: 'warning' }]
    },
    {
      id: 2,
      title: 'Marie Curie',
      subtitle: 'Niveau : 3ème B • Dossier #ADM-2024-002',
      avatarLabel: 'MC',
      date: 'Hier',
      badges: [{ label: 'Vérifié', class: 'info' }]
    },
    {
      id: 3,
      title: 'Abdoulaye Diallo',
      subtitle: 'Niveau : Terminale S • Dossier #ADM-2024-003',
      avatarLabel: 'AD',
      date: '24 Fév',
      badges: [{ label: 'Dossier Incomplet', class: 'danger' }]
    },
    {
      id: 4,
      title: 'Sophie Martin',
      subtitle: 'Niveau : CP • Dossier #ADM-2024-004',
      avatarLabel: 'SM',
      date: '20 Fév',
      badges: [{ label: 'Validé', class: 'success' }]
    },
    {
      id: 5,
      title: 'Thomas Anderson',
      subtitle: 'Niveau : Terminale S • Dossier #ADM-2024-005',
      avatarLabel: 'TA',
      date: '18 Fév',
      badges: [{ label: 'En attente', class: 'warning' }]
    }
  ]);

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    console.log('Changement d\'onglet :', tab);
  }

  viewDetails(row: TableRow) {
    this.router.navigate(['/admissions', row.id]);
  }
}
