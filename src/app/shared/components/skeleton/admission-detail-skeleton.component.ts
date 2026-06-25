import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SkeletonComponent} from './skeleton.component';

@Component({
  selector: 'fw-admission-detail-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="admission-skeleton-container">

      <!-- 🦴 Header Identity Mockup -->
      <div class="skeleton-header-hub">
        <div class="identity-mock">
          <fw-skeleton shape="rect" radius="10px" width="38px" height="38px"></fw-skeleton>
          <div class="text-group">
            <fw-skeleton width="120px" height="14px" class="mb-1"></fw-skeleton>
            <fw-skeleton width="60px" height="10px"></fw-skeleton>
          </div>
        </div>

        <div class="workflow-mock">
          <div class="dot-wrap" *ngFor="let i of [1,2,3,4,5]">
             <fw-skeleton shape="circle" width="24px" height="24px"></fw-skeleton>
             <div class="line-mock" *ngIf="i < 5"></div>
          </div>
        </div>

        <div class="actions-mock">
          <fw-skeleton shape="rect" radius="8px" width="80px" height="32px"></fw-skeleton>
          <fw-skeleton shape="rect" radius="8px" width="32px" height="32px"></fw-skeleton>
        </div>
      </div>

      <!-- 🦴 Layout Split -->
      <div class="skeleton-main-layout">

        <!-- Main Content (Cards) -->
        <div class="content-side">
          <div class="card-mock" *ngFor="let card of [1,2,3]">
            <div class="card-header-mock">
              <fw-skeleton shape="rect" radius="8px" width="32px" height="32px"></fw-skeleton>
              <div class="title-wrap">
                <fw-skeleton width="140px" height="12px" class="mb-1"></fw-skeleton>
                <fw-skeleton width="200px" height="10px"></fw-skeleton>
              </div>
            </div>
            <div class="card-body-mock">
              <div class="grid-mock">
                <div class="field-mock" *ngFor="let f of [1,2,3,4]">
                  <fw-skeleton width="40px" height="8px" class="mb-2"></fw-skeleton>
                  <fw-skeleton width="80%" height="12px"></fw-skeleton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar-side">
          <div class="sidebar-card-mock" *ngFor="let s of [1,2]">
            <fw-skeleton width="100px" height="12px" class="mb-4"></fw-skeleton>
            <div class="item-mock" *ngFor="let i of [1,2,3]">
              <fw-skeleton shape="circle" width="16px" height="16px"></fw-skeleton>
              <fw-skeleton width="70%" height="10px"></fw-skeleton>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .admission-skeleton-container {

      display: flex;
      flex-direction: column;
      gap: 0;
      height: 100vh;
      background: var(--fw-ice);
    }

    .skeleton-header-hub {
      height: 64px;
      background: white;
      border-bottom: 1px solid var(--fw-border-subtle);
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      gap: 2rem;
    }

    .identity-mock { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .text-group { display: flex; flex-direction: column; }

    .workflow-mock {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
    }
    .dot-wrap { display: flex; align-items: center; position: relative; }
    .line-mock { width: 32px; height: 2px; background: var(--fw-border-subtle); margin: 0 4px; }

    .actions-mock { display: flex; gap: 0.5rem; }

    .skeleton-main-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      flex: 1;
      overflow: hidden;
    }

    .content-side { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; }

    .card-mock {
      background: white;
      border-radius: 16px;
      border: 1px solid var(--fw-border-subtle);
      overflow: hidden;
    }
    .card-header-mock {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(0,0,0,0.04);
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .card-body-mock { padding: 1.5rem; }
    .grid-mock { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .sidebar-side {
      background: var(--fw-surface-sunken);
      border-left: 1px solid rgba(0,0,0,0.06);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .sidebar-card-mock {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.04);
    }
    .item-mock { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }

    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
  `]
})
export class AdmissionDetailSkeletonComponent {}
