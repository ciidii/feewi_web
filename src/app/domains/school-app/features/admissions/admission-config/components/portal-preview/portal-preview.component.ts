import {Component, computed, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Globe,
  Info,
  LucideAngularModule,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  UserCog,
  HeartPulse,
  Users,
  School,
  Plus,
  Lock
} from 'lucide-angular';
import {EnrollmentConfig} from '../../../../../../../core/models/enrollment.model';
import {AcademicYear} from '../../../../../../../core/models/academic.model';

@Component({
  selector: 'app-portal-preview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './portal-preview.component.html',
  styleUrls: ['./portal-preview.component.scss']
})
export class PortalPreviewComponent {
  config = input.required<EnrollmentConfig>();
  activeYear = input<AcademicYear | null>(null);

  /** Transforme le dictionnaire de piliers en liste ordonnée pour le rendu V4 */
  pillarsList = computed(() => {
    const cfg = this.config();
    const systemMeta: Record<string, { icon: any }> = {
      pillar_identity: { icon: UserCog },
      pillar_medical: { icon: HeartPulse },
      pillar_family: { icon: Users },
      pillar_schooling: { icon: School }
    };

    return Object.entries(cfg.pillars).map(([key, p]) => ({
      key,
      label: p.label,
      icon: systemMeta[key]?.icon || Sparkles,
      systemFields: p.systemFields,
      customFields: p.customFields
    }));
  });

  // Icônes
  readonly Globe = Globe;
  readonly Sparkles = Sparkles;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly ArrowRight = ArrowRight;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly Info = Info;
  readonly UserCheck = UserCheck;
  readonly Calendar = Calendar;
  readonly Plus = Plus;
  readonly Lock = Lock;

  get portalStatus(): 'OPEN' | 'CLOSED' {
    return this.config().portalActive ? 'OPEN' : 'CLOSED';
  }
}
