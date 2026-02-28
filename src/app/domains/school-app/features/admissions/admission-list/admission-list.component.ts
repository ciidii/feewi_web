import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Filter, Download, Layers, Clock, ShieldCheck, UserCheck } from 'lucide-angular';
import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { TabItem, TableRow } from '../../../../../shared/models/data-list.models';

@Component({
  selector: 'app-admissions',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule],
  templateUrl: './admission-list.component.html',
  styleUrl: './admission-list.component.scss',
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
      date: `Aujourd'hui`,
      badges: [{ label: 'Paiement OK', type: 'success' }, { label: 'Action requise', type: 'warning' }]
    },
    {
      id: 2,
      title: 'Marie Curie',
      subtitle: 'Niveau : 3ème B • Dossier #ADM-2024-002',
      avatarLabel: 'MC',
      date: 'Hier',
      badges: [{ label: 'Vérifié', type: 'info' }]
    },
    {
      id: 3,
      title: 'Abdoulaye Diallo',
      subtitle: 'Niveau : Terminale S • Dossier #ADM-2024-003',
      avatarLabel: 'AD',
      date: '24 Fév',
      badges: [{ label: 'Dossier Incomplet', type: 'danger' }]
    },
    {
      id: 4,
      title: 'Sophie Martin',
      subtitle: 'Niveau : CP • Dossier #ADM-2024-004',
      avatarLabel: 'SM',
      date: '20 Fév',
      badges: [{ label: 'Validé', type: 'success' }]
    },
    {
      id: 5,
      title: 'Thomas Anderson',
      subtitle: 'Niveau : Terminale S • Dossier #ADM-2024-005',
      avatarLabel: 'TA',
      date: '18 Fév',
      badges: [{ label: 'En attente', type: 'warning' }]
    }
  ]);

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    console.log(`Changement d'onglet :`, tab);
  }

  viewDetails(row: TableRow) {
    this.router.navigate(['/admissions', row.id]);
  }
}
