import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ShieldCheck, HelpCircle, LayoutDashboard, ArrowLeft } from 'lucide-angular';
import { TenantContextService } from '../../../../core/services/tenant-context.service';

@Component({
  selector: 'app-public-enrollment-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './public-enrollment-layout.component.html',
  styleUrls: ['./public-enrollment-layout.component.scss']
})
export class PublicEnrollmentLayoutComponent {
  private tenantContext = inject(TenantContextService);

  // Récupérer les informations de l'école (Tenant) de manière réactive
  tenant = this.tenantContext.activeTenant;

  // Déterminer le logo à afficher (Logo de l'école ou Placeholder)
  schoolLogo = computed(() => this.tenant()?.logoUrl || 'assets/placeholders/school-logo.svg');
  schoolName = computed(() => this.tenant()?.name || 'Portail Admissions');

  // Icônes pour le template
  readonly ShieldCheck = ShieldCheck;
  readonly HelpCircle = HelpCircle;
  readonly LayoutDashboard = LayoutDashboard;
  readonly ArrowLeft = ArrowLeft;
}
