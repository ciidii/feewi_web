import { Component, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, History, ShieldAlert, GraduationCap, CreditCard, Activity } from 'lucide-angular';
import {DataListComponent, TabItem, TableRow} from '../../../../../shared/components/data-list/data-list.component';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuditTrailComponent {
  readonly History = History;

  activeTab = signal('Tous');
  totalLogs = signal(1250);

  auditTabs: TabItem[] = [
    { label: 'Tous', icon: Activity, count: 1250 },
    { label: 'Sécurité', icon: ShieldAlert, count: 42 },
    { label: 'Scolarité', icon: GraduationCap, count: 850 },
    { label: 'Finance', icon: CreditCard, count: 358 }
  ];

  auditLogs = signal<TableRow[]>([
    {
      id: 1,
      title: 'Validation d\'inscription',
      subtitle: 'Dossier #ADM-2024-004 validé par Mamadou Diop',
      avatarLabel: 'MD',
      date: 'Il y a 5 min',
      badges: [{ label: 'SCOLARITÉ', class: 'info' }, { label: 'SUCCESS', class: 'success' }]
    },
    {
      id: 2,
      title: 'Modification de permissions',
      subtitle: 'Rôle "Comptable" mis à jour par Admin Système',
      avatarLabel: 'AD',
      date: 'Il y a 1h',
      badges: [{ label: 'SÉCURITÉ', class: 'danger' }, { label: 'SUCCESS', class: 'success' }]
    },
    {
      id: 3,
      title: 'Émission de reçu',
      subtitle: 'Paiement de 75.000 FCFA enregistré pour Marie Curie',
      avatarLabel: 'FN',
      date: 'Hier',
      badges: [{ label: 'FINANCE', class: 'warning' }, { label: 'SUCCESS', class: 'success' }]
    },
    {
      id: 4,
      title: 'Tentative de connexion',
      subtitle: 'Échec d\'authentification pour l\'utilisateur "test@user.com"',
      avatarLabel: '??',
      date: 'Hier',
      badges: [{ label: 'SÉCURITÉ', class: 'danger' }, { label: 'FAILURE', class: 'danger' }]
    },
    {
      id: 5,
      title: 'Création de classe',
      subtitle: 'Nouvelle classe "6ème C" ajoutée au référentiel',
      avatarLabel: 'MD',
      date: '24 Fév',
      badges: [{ label: 'SCOLARITÉ', class: 'info' }, { label: 'SUCCESS', class: 'success' }]
    }
  ]);

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }
}
