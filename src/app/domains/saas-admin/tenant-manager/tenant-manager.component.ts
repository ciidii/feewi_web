import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DataListComponent, TableRow, TabItem } from '../../../shared/components/data-list/data-list.component';
import { LucideAngularModule, Building2, Plus, Globe, ShieldCheck, Activity } from 'lucide-angular';
import { TenantFormComponent } from '../tenant-form/tenant-form.component';

@Component({
  selector: 'app-tenant-manager',
  standalone: true,
  imports: [CommonModule, DataListComponent, LucideAngularModule, MatDialogModule],
  templateUrl: './tenant-manager.component.html',
  styleUrl: './tenant-manager.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class TenantManagerComponent {
  private dialog = inject(MatDialog);

  readonly ShieldCheck = ShieldCheck;
  readonly Plus = Plus;

  activeTab = signal('Tous');
  totalTenants = signal(12);

  tenantTabs: TabItem[] = [
    { label: 'Tous', icon: Building2, count: 12 },
    { label: 'Actifs', icon: Activity, count: 10 },
    { label: 'En attente', icon: Globe, count: 2 }
  ];

  tenants = signal<TableRow[]>([
    {
      id: 'feewi-demo',
      title: 'École Internationale Feewi',
      subtitle: 'feewi-demo.edu.sn • Dakar, Sénégal',
      avatarLabel: 'EI',
      date: 'Créé le 12 Jan 2024',
      badges: [{ label: 'PREMIUM', class: 'success' }, { label: 'ACTIVE', class: 'info' }]
    },
    {
      id: 'sacre-coeur',
      title: 'Collège Sacré-Cœur',
      subtitle: 'sacre-coeur.sn • Dakar, Sénégal',
      avatarLabel: 'SC',
      date: 'Créé le 05 Fév 2024',
      badges: [{ label: 'ENTERPRISE', class: 'success' }, { label: 'ACTIVE', class: 'info' }]
    },
    {
      id: 'mary-test',
      title: 'Lycée Marie Curie (Test)',
      subtitle: 'm-curie.test.feewi.io',
      avatarLabel: 'MC',
      date: 'Créé hier',
      badges: [{ label: 'TRIAL', class: 'warning' }, { label: 'PENDING', class: 'danger' }]
    }
  ]);

  openCreateModal() {
    const dialogRef = this.dialog.open(TenantFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Nouveau tenant créé :', result);
      }
    });
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
  }
}
