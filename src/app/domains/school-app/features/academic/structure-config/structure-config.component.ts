import { Component, inject, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Layers, Edit, Trash2, ArrowRight } from 'lucide-angular';
import { AcademicService } from '../../../../../core/services/academic.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../shared/services/notification.service';
import { Cycle } from '../../../../../core/models/academic.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CycleFormComponent } from './components/cycle-form/cycle-form.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-structure-config',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatDialogModule],
  templateUrl: './structure-config.component.html',
  styleUrls: ['./structure-config.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StructureConfigComponent implements OnInit {
  private academicService = inject(AcademicService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Icônes
  readonly Plus = Plus;
  readonly Layers = Layers;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly ArrowRight = ArrowRight;

  // États
  cycles = signal<Cycle[]>([]);
  isLoading = signal(true);

  // Autorisations (Provisioning)
  readonly canEditStructure = computed(() => this.authService.hasRole('ROLE_SUPER_ADMIN'));

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const cyclesData = await this.academicService.getCycles();
      // On fait confiance à l'API pour les cycles activés (Tenant-scoped)
      this.cycles.set(cyclesData.sort((a, b) => a.rank - b.rank));
    } catch (error) {
      this.notificationService.error("Erreur lors du chargement de la structure.");
    } finally {
      this.isLoading.set(false);
    }
  }

  // Navigation vers le Cockpit du Cycle (Drill-down)
  goToCycle(id: string) {
    this.router.navigate(['/classes/cycles', id]);
  }

  // --- ACTIONS CYCLES (Super Admin uniquement) ---

  openAddCycle() {
    const dialogRef = this.dialog.open(CycleFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  onEditCycle(cycle: Cycle) {
    const dialogRef = this.dialog.open(CycleFormComponent, {
      width: '480px',
      panelClass: 'feewi-dialog-panel',
      data: { cycle }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  onDeleteCycle(cycle: Cycle) {
    const cycleName = cycle.customName || cycle.systemName;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le cycle ?',
        message: `Voulez-vous supprimer le cycle "${cycleName}" ? Tous les niveaux rattachés à ce cycle seront impactés.`,
        confirmLabel: 'Oui, supprimer le cycle',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.academicService.deleteCycle(cycle.id);
          this.notificationService.success('Cycle supprimé avec succès.');
          this.loadData();
        } catch (error) {
          this.notificationService.error('Erreur lors de la suppression.');
        }
      }
    });
  }
}
