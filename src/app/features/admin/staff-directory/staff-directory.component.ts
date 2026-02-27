import { Component, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmartDataTableComponent, TableRow, TabItem } from '../../../shared/components/smart-data-table.component';
import { LucideAngularModule, UserPlus, Shield, Filter, Download, Users, UserCheck, UserX } from 'lucide-angular';

@Component({
  selector: 'app-staff-directory',
  standalone: true,
  imports: [CommonModule, SmartDataTableComponent, LucideAngularModule],
  templateUrl: './staff-directory.component.html',
  styleUrl: './staff-directory.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StaffDirectoryComponent {
  readonly UserPlus = UserPlus;
  readonly Filter = Filter;
  readonly Download = Download;

  activeTab = signal('Tous');
  totalStaff = signal(24);

  staffTabs: TabItem[] = [
    { label: 'Tous', icon: Users, count: 24 },
    { label: 'Administratifs', icon: Shield, count: 6 },
    { label: 'Enseignants', icon: UserCheck, count: 15 },
    { label: 'Inactifs', icon: UserX, count: 3 }
  ];

  staffMembers = signal<TableRow[]>([
    {
      id: 1,
      title: 'Mamadou Diop',
      subtitle: 'Principal • mamadou.diop&#64;feewi.io',
      avatarLabel: 'MD',
      date: 'Connecté il y a 5 min',
      badges: [{ label: 'SCHOOL_ADMIN', class: 'success' }, { label: 'Permanent', class: 'info' }]
    },
    {
      id: 2,
      title: 'Aïssatou Sow',
      subtitle: 'Enseignante Mathématiques • aissatou.sow&#64;feewi.io',
      avatarLabel: 'AS',
      date: 'Hier',
      badges: [{ label: 'TEACHER', class: 'info' }]
    },
    {
      id: 3,
      title: 'Fatou Ndiaye',
      subtitle: 'Comptable • fatou.ndiaye&#64;feewi.io',
      avatarLabel: 'FN',
      date: '24 Fév',
      badges: [{ label: 'ACCOUNTANT', class: 'warning' }]
    },
    {
      id: 4,
      title: 'Ibrahima Fall',
      subtitle: 'Surveillant Général • ibrahima.fall&#64;feewi.io',
      avatarLabel: 'IF',
      date: '20 Fév',
      badges: [{ label: 'STAFF', class: 'info' }]
    },
    {
      id: 5,
      title: 'Christian Gomis',
      subtitle: 'Ancien Enseignant • christian.gomis&#64;feewi.io',
      avatarLabel: 'CG',
      date: '15 Jan',
      badges: [{ label: 'INACTIF', class: 'danger' }]
    }
  ]);

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }
}
