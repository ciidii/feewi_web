import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExamResult} from '../../../../../core/models/showcase';
import {FwBadgeComponent} from '../../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-exam-result-card',
  standalone: true,
  imports: [CommonModule, FwBadgeComponent],
  template: `
    <div class="result-card">
      <div class="result-header">
        <span class="result-exam">{{ result.examLabel }}</span>
        <app-fw-badge [labelOverride]="result.year" tokenOverride="neutral" />
      </div>

      <div class="result-rate">
        <span class="rate-value">{{ result.successRate }}%</span>
        <span class="rate-label">de réussite</span>
      </div>

      <div class="result-meta">
        <span>{{ result.admittedCount }} admis sur {{ result.totalCandidates }} candidats</span>
        <span *ngIf="result.series">{{ result.series }}</span>
      </div>
    </div>
  `,
  styles: [`
    .result-card {
      background: var(--fw-surface-card);
      border: 1px solid var(--fw-border);
      border-radius: var(--fw-radius-lg);
      padding: var(--fw-space-lg);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .result-exam {
      font-family: var(--fw-font-display);
      font-weight: 800;
      font-size: 0.9375rem;
      color: var(--fw-text-primary);
    }

    .result-rate {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .rate-value {
      font-family: var(--fw-font-display);
      font-size: 2.25rem;
      font-weight: 900;
      color: var(--fw-primary);
      line-height: 1;
    }

    .rate-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--fw-text-secondary);
    }

    .result-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.8125rem;
      color: var(--fw-text-secondary);
    }
  `]
})
export class ExamResultCardComponent {
  @Input({required: true}) result!: ExamResult;
}
