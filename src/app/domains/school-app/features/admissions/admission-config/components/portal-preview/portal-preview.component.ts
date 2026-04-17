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

  /** Construit la liste des piliers depuis le schéma v7 pour le rendu */
  pillarsList = computed(() => {
    const schema = this.config().schema;
    const pillars = [
      {
        key: 'identity',
        label: 'Identité',
        icon: UserCog,
        systemFields: Object.entries(schema.identity.coreFieldControls).map(([name, ctrl]) => ({
          name, label: ctrl.label, type: 'TEXT', mandatory: true
        })),
        customFields: schema.identity.customFields
      },
      {
        key: 'family',
        label: 'Famille',
        icon: Users,
        systemFields: Object.entries(schema.family.guardianCoreFieldControls).map(([name, ctrl]) => ({
          name, label: ctrl.label, type: 'TEXT', mandatory: true
        })),
        customFields: schema.family.guardianCustomFields
      },
      {
        key: 'medical',
        label: 'Santé',
        icon: HeartPulse,
        systemFields: [],
        customFields: schema.medical.customFields
      },
      {
        key: 'schooling',
        label: 'Scolarité',
        icon: School,
        systemFields: [],
        customFields: schema.schooling.customFields
      }
    ];
    return pillars.filter(p => p.systemFields.length > 0 || p.customFields.length > 0);
  });

  get documentChecklist() {
    return this.config().schema.documents.presetDocuments;
  }

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
