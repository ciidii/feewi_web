import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Home, Phone, Sparkles, CheckCircle, AlertTriangle, ArrowRight, Edit2, Check } from 'lucide-angular';

@Component({
  selector: 'app-soft-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './public-soft-enrollment.component.html',
  styleUrls: ['./public-soft-enrollment.component.scss']
})
export class SoftEnrollmentComponent {
  // Simulation des données existantes (Student Registry)
  student = signal({
    id: 'STU-2024-045',
    name: 'Marie-Sophie Diallo',
    currentLevel: 'CM1-A',
    nextLevel: 'CM2-B',
    academicYear: '2026-2027'
  });

  // États d'édition des sections
  isEditingContacts = signal(false);

  // Services pour l'année prochaine
  services = signal({
    canteen: true,
    transport: false,
    extraCurricular: ['Judo', 'Théâtre']
  });

  // État de validation
  isConfirmed = signal(false);

  // Icônes
  readonly User = User;
  readonly Home = Home;
  readonly Phone = Phone;
  readonly Sparkles = Sparkles;
  readonly CheckCircle = CheckCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly ArrowRight = ArrowRight;
  readonly Edit2 = Edit2;
  readonly Check = Check;
}
