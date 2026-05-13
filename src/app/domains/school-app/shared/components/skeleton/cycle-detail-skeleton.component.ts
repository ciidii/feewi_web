import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SkeletonComponent} from '../../../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-cycle-detail-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="cycle-skeleton-container animate-in fade-in duration-500">

      <!-- Command Bar Mockup -->
      <div class="command-bar-mock">
        <fw-skeleton width="240px" height="36px" radius="8px"></fw-skeleton>
        <div class="flex-1"></div>
        <fw-skeleton width="100px" height="36px" radius="8px"></fw-skeleton>
      </div>

      <!-- Level Groups Mockup -->
      <div class="space-y-6">
        <div *ngFor="let card of [1, 2]" class="skeleton-card">
          <!-- Card Header Mock -->
          <div class="skeleton-card-header">
            <div class="header-left">
              <fw-skeleton shape="rect" radius="8px" width="32px" height="32px"></fw-skeleton>
              <div class="text-group">
                <fw-skeleton width="180px" height="14px" class="mb-1"></fw-skeleton>
                <fw-skeleton width="120px" height="10px"></fw-skeleton>
              </div>
            </div>
            <div class="header-actions">
              <fw-skeleton width="80px" height="32px" radius="8px"></fw-skeleton>
              <fw-skeleton width="80px" height="32px" radius="8px"></fw-skeleton>
              <fw-skeleton width="32px" height="32px" radius="8px"></fw-skeleton>
            </div>
          </div>

          <!-- Class Grid Mock -->
          <div class="skeleton-card-content">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let tile of [1, 2, 3]" class="skeleton-tile">
                <div class="tile-main">
                  <fw-skeleton width="60%" height="14px" class="mb-2"></fw-skeleton>
                  <fw-skeleton width="40%" height="10px" class="mb-4"></fw-skeleton>
                  <div class="flex items-center gap-2">
                    <fw-skeleton shape="circle" width="8px" height="8px"></fw-skeleton>
                    <fw-skeleton width="80px" height="10px"></fw-skeleton>
                  </div>
                </div>
                <div class="tile-icon-mock">
                  <fw-skeleton shape="circle" width="24px" height="24px" class="opacity-10"></fw-skeleton>
                </div>
              </div>

              <!-- Add Button Mock -->
              <div class="skeleton-tile border-dashed border-2 border-slate-200 bg-transparent flex items-center justify-center gap-2">
                <fw-skeleton shape="circle" width="20px" height="20px"></fw-skeleton>
                <fw-skeleton width="100px" height="12px"></fw-skeleton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cycle-skeleton-container {
      padding: 0;
    }

    .command-bar-mock {
      display: flex;
      align-items: center;
      gap: 1rem;
      height: 64px;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--fw-border-light);
    }

    .skeleton-card {
      background: white;
      border: 1px solid var(--fw-border-light);
      border-radius: 12px;
      overflow: hidden;
    }

    .skeleton-card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--fw-border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .skeleton-card-content {
      padding: 1.5rem;
    }

    .skeleton-tile {
      height: 100px;
      padding: 1rem;
      background: var(--fw-ice);
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border: 1px solid transparent;
    }

    .tile-main {
      flex: 1;
    }

    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
  `]
})
export class CycleDetailSkeletonComponent {}
