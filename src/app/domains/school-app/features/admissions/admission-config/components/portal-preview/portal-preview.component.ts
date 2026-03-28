import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Globe, Sparkles, Search, RefreshCw, ArrowRight, CheckCircle, Clock, Info, UserCheck, Calendar } from 'lucide-angular';
import { EnrollmentConfig } from '../../../../../../../core/models/enrollment.model';
import { AcademicYear } from '../../../../../../../core/models/academic.model';

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

  // Icônes pour le simulateur
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

  get portalStatus(): 'OPEN' | 'CLOSED' {
    return this.config().isPublicPortalOpen ? 'OPEN' : 'CLOSED';
  }
}
