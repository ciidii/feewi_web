import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Filter, Download, Layers, Clock, ShieldCheck, UserCheck, Eye, CheckCircle, XCircle } from 'lucide-angular';
import { DataListComponent } from '../../../../../shared/components/data-list/data-list.component';
import { RowAction, TabItem, TableRow } from '../../../../../shared/models/data-list.models';

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
  readonly Layers = Layers;

  activeTab = signal('Tous');
  totalAdmissions = signal(142);

  // Configuration des actions dynamiques pour les admissions
  readonly admissionActions: RowAction[] = [
    { id: 'view', label: 'Voir le dossier', icon: Eye, type: 'primary' },
    { id: 'validate', label: 'Approuver', icon: CheckCircle, type: 'success' },
    { id: 'reject', label: 'Rejeter', icon: XCircle, type: 'danger' }
  ];

  admissionTabs: TabItem[] = [
    { label: 'Tous', icon: Layers, count: 142 },
    { label: 'À Vérifier', icon: Clock, count: 24 }, // SUBMITTED
    { label: 'À Évaluer', icon: ShieldCheck, count: 86 }, // VERIFIED
    { label: 'En Décision', icon: UserCheck, count: 32 } // TESTING / WAITLIST
  ];

  admissions = signal<TableRow[]>([
    {
      id: 1,
      title: 'Jean Dupont',
      subtitle: 'Niveau : 6ème A • Dossier #ADM-2024-001',
      avatarLabel: 'JD',
      date: `Aujourd'hui`,
      badges: [
        { label: 'Paiement OK', type: 'success' }, 
        { label: 'Scan Check : 100%', type: 'info' }
      ]
    },
    {
      id: 2,
      title: 'Marie Curie',
      subtitle: 'Niveau : 3ème B • Dossier #ADM-2024-002',
      avatarLabel: 'MC',
      date: 'Hier',
      badges: [
        { label: 'À Numériser', type: 'warning' },
        { label: 'Paiement OK', type: 'success' }
      ]
    },
    {
      id: 3,
      title: 'Abdoulaye Diallo',
      subtitle: 'Niveau : Terminale S • Dossier #ADM-2024-003',
      avatarLabel: 'AD',
      date: '24 Fév',
      badges: [
        { label: 'Dossier Incomplet', type: 'danger' },
        { label: 'Test requis', type: 'warning' }
      ]
    },
    {
      id: 4,
      title: 'Sophie Martin',
      subtitle: 'Niveau : CP • Dossier #ADM-2024-004',
      avatarLabel: 'SM',
      date: '20 Fév',
      badges: [
        { label: 'Validé', type: 'success' },
        { label: 'Réinscription', type: 'info' }
      ]
    },
    {
      id: 5,
      title: 'Thomas Anderson',
      subtitle: 'Niveau : Terminale S • Dossier #ADM-2024-005',
      avatarLabel: 'TA',
      date: '18 Fév',
      badges: [
        { label: 'Waitlist', type: 'warning' }
      ]
    }
  ]);

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    console.log(`Changement d'onglet :`, tab);
  }

  handleAction(event: { actionId: string, row: TableRow }) {
    switch (event.actionId) {
      case 'view':
        this.router.navigate(['/admissions', event.row.id]);
        break;
      case 'validate':
        console.log('Validation du dossier', event.row.id);
        break;
      case 'reject':
        console.log('Rejet du dossier', event.row.id);
        break;
    }
  }
}
