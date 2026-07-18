import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  ArrowRight,
  BookOpen,
  Bus,
  CheckCircle2,
  HeartPulse,
  Laptop,
  Library,
  LucideAngularModule,
  Utensils,
  Wallet,
} from 'lucide-angular';
import {finalize, forkJoin} from 'rxjs';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {ShowcaseContentService} from '../../../../core/services/showcase-content.service';
import {CampusAmenity, PricingPlan} from '../../../../core/models/showcase';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {FwBadgeComponent} from '../../../../shared/components/badge/badge.component';
import {BlockLoaderComponent} from '../../../../shared/components/loader/block-loader.component';

const AMENITY_ICONS: Record<string, any> = {
  Utensils, Bus, BookOpen, HeartPulse, Laptop, Library,
};

@Component({
  selector: 'app-showcase-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FwButtonComponent, FwBadgeComponent, BlockLoaderComponent],
  templateUrl: './showcase-pricing.component.html',
  styleUrls: ['./showcase-pricing.component.scss']
})
export class ShowcasePricingComponent implements OnInit {
  private showcaseService = inject(ShowcaseContentService);
  tenantCtx = inject(TenantContextService);

  isLoading = signal(true);
  pricingPlans = signal<PricingPlan[]>([]);
  amenities = signal<CampusAmenity[]>([]);

  faqItems = [
    {q: 'Le paiement échelonné est-il possible ?', a: 'Oui, les frais de scolarité peuvent être réglés en plusieurs tranches sur l\'année scolaire. Contactez le secrétariat pour établir un échéancier.'},
    {q: 'Des bourses ou réductions existent-elles ?', a: 'Des réductions sont accordées pour les fratries (2ème enfant et plus). Rapprochez-vous de l\'administration pour connaître les conditions.'},
    {q: 'Les frais d\'inscription sont-ils remboursables ?', a: 'Les frais d\'inscription ne sont pas remboursables une fois le dossier validé par l\'établissement.'},
  ];

  ngOnInit() {
    const tenantId = this.tenantCtx.activeTenant()!.id;
    forkJoin({
      pricing: this.showcaseService.getPricingPlans(tenantId),
      amenities: this.showcaseService.getCampusAmenities(tenantId),
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({pricing, amenities}) => {
      this.pricingPlans.set(pricing);
      this.amenities.set(amenities);
    });
  }

  iconFor(name: string) {
    return AMENITY_ICONS[name] ?? CheckCircle2;
  }

  readonly ArrowRight = ArrowRight;
  readonly Wallet = Wallet;
  readonly CheckCircle2 = CheckCircle2;
}
