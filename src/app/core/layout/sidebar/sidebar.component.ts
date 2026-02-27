import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationStateService } from '../../services/navigation-state.service';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, ChevronLeft, ChevronRight, Plus, Users, School, Calendar, BookOpen, FileText, Briefcase, ShieldCheck } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, LucideAngularModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navService = inject(NavigationStateService);
  readonly Plus = Plus;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  academicItems = [
    { label: 'Admissions', icon: Briefcase, route: '/admissions' },
    { label: 'Classes', icon: School, route: '/classes' },
    { label: 'Élèves', icon: Users, route: '/students' },
  ];

  identityItems = [
    { label: 'Personnel', icon: Users, route: '/identity/staff' },
    { label: 'Rôles & Droits', icon: ShieldCheck, route: '/identity/roles' },
    { label: 'Journal d\'audit', icon: FileText, route: '/identity/audit' },
  ];
}
