import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, GraduationCap, TrendingUp, Activity } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent {
  readonly Users = Users;
  readonly GraduationCap = GraduationCap;
  readonly TrendingUp = TrendingUp;
  readonly Activity = Activity;
}
