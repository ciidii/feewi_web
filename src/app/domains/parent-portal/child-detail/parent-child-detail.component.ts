import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {ArrowLeft, GraduationCap, LucideAngularModule} from 'lucide-angular';
import {GuardianService, MyChild} from '../../../core/services/guardian.service';
import {SkeletonComponent} from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-parent-child-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, SkeletonComponent],
  templateUrl: './parent-child-detail.component.html',
  styleUrl: './parent-child-detail.component.scss'
})
export class ParentChildDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private guardianService = inject(GuardianService);

  readonly ArrowLeft = ArrowLeft;
  readonly GraduationCap = GraduationCap;

  isLoading = signal(true);
  child = signal<MyChild | null>(null);

  ngOnInit() {
    const studentId = this.route.snapshot.paramMap.get('id');

    this.guardianService.getMyChildren().subscribe({
      next: (children) => {
        this.child.set(children.find(c => c.studentId === studentId) ?? null);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Scolarisé',
      LEFT: 'Parti',
      ARCHIVED: 'Archivé'
    };
    return labels[status] || status;
  }

  goBack() {
    this.router.navigate(['/parent/dashboard']);
  }
}
