import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Search,
  User,
  ArrowRight,
  Save,
  X,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle,
  Info
} from 'lucide-angular';

@Component({
  selector: 'app-secretary-re-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './re-enrollment.component.html',
  styleUrls: ['./re-enrollment.component.scss']
})
export class SecretaryReEnrollmentComponent {
  // État de la recherche
  searchQuery = signal('');
  selectedStudent = signal<any>(null);

  // Simulation de résultats de recherche
  students = signal([
    { id: 'STU-001', name: 'Marie-Sophie Diallo', level: 'CM1-A', parent: 'Robert Diallo' },
    { id: 'STU-002', name: 'Jean-Pierre Diop', level: '6ème B', parent: 'Fatou Diop' },
    { id: 'STU-003', name: 'Awa Ndiaye', level: 'CM1-A', parent: 'Moussa Ndiaye' }
  ]);

  filteredResults = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return [];
    return this.students().filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  });

  // Sélectionner un élève
  selectStudent(student: any) {
    this.selectedStudent.set({
      ...student,
      nextLevel: student.level.startsWith('CM1') ? 'CM2-A' : '5ème B',
      academicYear: '2026-2027',
      phone: '+221 77 123 45 67',
      address: 'Villa 45, Plateau, Dakar'
    });
    this.searchQuery.set('');
  }

  // Actions
  onSave() {
    console.log('Réinscription enregistrée par le secrétaire');
    // Logique de sauvegarde
  }

  // Icônes
  readonly Search = Search;
  readonly User = User;
  readonly ArrowRight = ArrowRight;
  readonly Save = Save;
  readonly X = X;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Sparkles = Sparkles;
  readonly CheckCircle = CheckCircle;
  protected readonly Info = Info;
}
