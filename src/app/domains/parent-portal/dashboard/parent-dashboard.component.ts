import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {ChevronRight, GraduationCap, LucideAngularModule, Users} from 'lucide-angular';
import {GuardianService, MyChild} from '../../../core/services/guardian.service';
import {SkeletonComponent} from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SkeletonComponent],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.scss'
})
export class ParentDashboardComponent implements OnInit {
  private guardianService = inject(GuardianService);
  private router = inject(Router);

  readonly Users = Users;
  readonly GraduationCap = GraduationCap;
  readonly ChevronRight = ChevronRight;

  isLoading = signal(true);
  children = signal<MyChild[]>([]);

  ngOnInit() {
    this.guardianService.getMyChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openChild(id: string) {
    this.router.navigate(['/parent/child', id]);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Scolarisé',
      LEFT: 'Parti',
      ARCHIVED: 'Archivé'
    };
    return labels[status] || status;
  }
}
