import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, Settings, Briefcase, GraduationCap, LayoutGrid, ShieldCheck } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-rail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './app-rail.component.html',
  styleUrl: './app-rail.component.scss'
})
export class AppRailComponent {
  auth = inject(AuthService);
  readonly Home = Home;
  readonly Settings = Settings;
  readonly Briefcase = Briefcase;
  readonly GraduationCap = GraduationCap;
  readonly LayoutGrid = LayoutGrid;
  readonly ShieldCheck = ShieldCheck;
}
