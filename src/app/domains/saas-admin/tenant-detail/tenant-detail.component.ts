import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  ArrowLeft, Building2, Mail, Phone, MapPin, 
  Globe, Calendar, ShieldCheck, CheckCircle, 
  XCircle, Edit, Trash2, Printer, MoreVertical,
  Activity, Users, CreditCard, History, ChevronRight,
  User, ExternalLink
} from 'lucide-angular';
import { SchoolService } from '../../../core/services/school.service';
import { School } from '../../../core/models/school.model';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.scss']
})
export class TenantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schoolService = inject(SchoolService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  school = signal<School | null>(null);
  isLoading = signal(true);

  // Icônes
  readonly ArrowLeft = ArrowLeft;
  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Globe = Globe;
  readonly Calendar = Calendar;
  readonly ShieldCheck = ShieldCheck;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Printer = Printer;
  readonly MoreVertical = MoreVertical;
  readonly Activity = Activity;
  readonly Users = Users;
  readonly CreditCard = CreditCard;
  readonly History = History;
  readonly ChevronRight = ChevronRight;
  readonly User = User;
  readonly ExternalLink = ExternalLink;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSchool(id);
    } else {
      this.notificationService.error("ID d'établissement manquant.");
      this.router.navigate(['/saas/tenants']);
    }
  }

  async loadSchool(id: string) {
    this.isLoading.set(true);
    try {
      const data = await this.schoolService.getSchoolById(id);
      this.school.set(data);
    } catch (err) {
      this.notificationService.error("Impossible de charger les détails de l'établissement.");
      this.router.navigate(['/saas/tenants']);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onImpersonate() {
    const s = this.school();
    if (!s || !s.tenantId) return;
    
    this.notificationService.info(`Connexion en cours sur le tenant ${s.tenantId}...`);
    // Note: L'impersonnalisation nécessite l'ID de l'admin de l'école dans l'API V2
    // Pour l'instant on simule ou on utilise l'ID si dispo
    this.notificationService.warning("Action en cours d'intégration API.");
  }

  onEdit() {
    this.notificationService.info("Ouverture du formulaire d'édition...");
  }

  formatDate(date?: string): string {
    if (!date) return 'Date inconnue';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
