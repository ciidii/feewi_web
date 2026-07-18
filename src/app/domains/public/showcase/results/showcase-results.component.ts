import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {ArrowRight, Award, LucideAngularModule, Medal} from 'lucide-angular';
import {finalize} from 'rxjs';
import {TenantContextService} from '../../../../core/services/tenant-context.service';
import {ShowcaseContentService} from '../../../../core/services/showcase-content.service';
import {ExamResult} from '../../../../core/models/showcase';
import {FwButtonComponent} from '../../../../shared/components/button/button.component';
import {FwTabsComponent, FwTab} from '../../../../shared/components/tabs/tabs.component';
import {FwEmptyStateComponent} from '../../../../shared/components/empty-state/empty-state.component';
import {BlockLoaderComponent} from '../../../../shared/components/loader/block-loader.component';
import {ExamResultCardComponent} from '../shared/exam-result-card/exam-result-card.component';

@Component({
  selector: 'app-showcase-results',
  standalone: true,
  imports: [
    CommonModule, RouterModule, LucideAngularModule, FwButtonComponent,
    FwTabsComponent, FwEmptyStateComponent, BlockLoaderComponent, ExamResultCardComponent
  ],
  templateUrl: './showcase-results.component.html',
  styleUrls: ['./showcase-results.component.scss']
})
export class ShowcaseResultsComponent implements OnInit {
  private showcaseService = inject(ShowcaseContentService);
  tenantCtx = inject(TenantContextService);

  isLoading = signal(true);
  examResults = signal<ExamResult[]>([]);
  activeExam = signal<string>('');

  examTabs = computed<FwTab[]>(() => {
    const labels = Array.from(new Set(this.examResults().map(r => r.examLabel)));
    return labels.map(label => ({id: label, label}));
  });

  filteredResults = computed(() =>
    this.examResults()
      .filter(r => r.examLabel === this.activeExam())
      .sort((a, b) => b.year.localeCompare(a.year))
  );

  latestTopStudents = computed(() => this.filteredResults()[0]?.topStudents ?? []);

  ngOnInit() {
    const tenantId = this.tenantCtx.activeTenant()!.id;
    this.showcaseService.getExamResults(tenantId).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(results => {
      this.examResults.set(results);
      if (results.length) {
        this.activeExam.set(results[0].examLabel);
      }
    });
  }

  onTabChange(examLabel: string) {
    this.activeExam.set(examLabel);
  }

  readonly ArrowRight = ArrowRight;
  readonly Award = Award;
  readonly Medal = Medal;
}
