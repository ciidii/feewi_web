import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {
  AlertTriangle,
  Building2,
  CreditCard,
  LucideAngularModule,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-angular';
import {FwPageShellComponent} from '../../../shared/components/page-shell/page-shell.component';
import {SubscriptionService} from '../../../core/services/subscription.service';
import {BillingOverview, RelanceItem} from '../../../core/models/subscription.model';

@Component({
  selector: 'app-saas-billing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FwPageShellComponent],
  templateUrl: './saas-billing.component.html'
})
export class SaasBillingComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);

  readonly TrendingUp = TrendingUp;
  readonly Building2 = Building2;
  readonly Users = Users;
  readonly CreditCard = CreditCard;
  readonly AlertTriangle = AlertTriangle;
  readonly RefreshCw = RefreshCw;

  overview = signal<BillingOverview | null>(null);
  relances = signal<RelanceItem[]>([]);
  isLoading = signal(true);

  hasRelances = computed(() => this.relances().length > 0);

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading.set(true);
    this.subscriptionService.getBillingOverview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.subscriptionService.getRelances().subscribe({
      next: (items) => this.relances.set(items),
      error: () => this.relances.set([])
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PAST_DUE': return 'Impayé';
      case 'SUSPENDED': return 'Suspendu';
      case 'TRIAL': return 'Essai';
      case 'ACTIVE': return 'À jour';
      case 'CANCELLED': return 'Résilié';
      default: return status;
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'PAST_DUE': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'SUSPENDED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TRIAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'});
  }
}
