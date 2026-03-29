import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShieldCheck, HelpCircle, LayoutDashboard, ArrowLeft, Search } from 'lucide-angular';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { SchoolService } from '../../../../core/services/school.service';

@Component({
  selector: 'app-public-enrollment-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './public-enrollment-layout.component.html',
  styleUrls: ['./public-enrollment-layout.component.scss']
})
export class PublicEnrollmentLayoutComponent implements OnInit {
  private tenantContext = inject(TenantContextService);
  private schoolService = inject(SchoolService);

  // Récupérer les informations de l'école (Tenant) de manière réactive
  tenant = this.tenantContext.activeTenant;

  // Déterminer le logo à afficher (Logo de l'école ou Placeholder)
  schoolLogo = computed(() => this.tenant()?.logoUrl || 'assets/placeholders/school-logo.svg');
  schoolName = computed(() => this.tenant()?.name || 'Portail Admissions');

  ngOnInit() {
    this.ensureTenantContext();
  }

  /**
   * S'assure que le contexte de l'école est chargé.
   * Si aucun tenant n'est actif, on initialise avec le tenant de test.
   */
  private ensureTenantContext() {
    if (!this.tenantContext.hasTenant()) {
      const defaultTenantId = 'bruno-test-full'; // À adapter selon le besoin local
      this.schoolService.getPublicSchoolInfo(defaultTenantId).subscribe({
        next: (school) => {
          this.tenantContext.setTenant({
            id: school.tenantId,
            name: school.name,
            logoUrl: school.logoUrl,
            allowedCycles: ['PRIMAIRE', 'COLLEGE', 'LYCEE'] // Valeurs par défaut pour le portail public
          });
        },
        error: (err) => console.error('[PublicPortal] Impossible d\'initialiser le contexte école', err)
      });
    }
  }

  // Icônes pour le template
  readonly ShieldCheck = ShieldCheck;
  readonly HelpCircle = HelpCircle;
  readonly LayoutDashboard = LayoutDashboard;
  readonly ArrowLeft = ArrowLeft;
  readonly Search = Search;
}
