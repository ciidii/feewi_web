import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Printer, Download,
  User, Mail, Phone, MapPin, FileText,
  CreditCard, Pencil, MoreVertical, Eye,
  Plus, MessageSquare, History, File,
  FileImage, FileSpreadsheet
} from 'lucide-angular';

import { FormsModule } from '@angular/forms';
import { AdmissionWorkflowComponent, AdmissionState } from '../components/admission-workflow/admission-workflow.component';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, AdmissionWorkflowComponent, FormsModule],
  templateUrl: './admission-detail.component.html',
  styleUrls: ['./admission-detail.component.scss']
})
export class AdmissionDetailComponent {
  admissionState = signal<AdmissionState>('VERIFIED');
  showDocumentViewer = signal(true);
  selectedDocument = signal<any>(null);

  evaluation = signal([
    { subject: 'Français', score: 14, max: 20 },
    { subject: 'Mathématiques', score: 12, max: 20 },
    { subject: 'Éveil', score: 15, max: 20 }
  ]);

  averageScore = computed(() => {
    const evals = this.evaluation();
    const sum = evals.reduce((acc, curr) => acc + curr.score, 0);
    return (sum / evals.length).toFixed(2);
  });

  pedagogicalDecision = signal('ADMIS');

  student = signal({
    id: 'ADM-2024-001',
    name: 'Jean Dupont',
    email: 'parents.dupont@email.com',
    phone: '+221 77 123 45 67',
    birthDate: '12 Mai 2012',
    address: 'Villa 123, Sacré-Cœur 3, Dakar',
    gender: 'Masculin',
    nationality: 'Sénégalaise',
    requestedLevel: '6ème A',
    previousSchool: 'École des Maristes'
  });

  parents = signal([
    { role: 'Père', name: 'Robert Dupont', phone: '+221 77 111 22 33', job: 'Ingénieur' },
    { role: 'Mère', name: 'Marie Dupont', phone: '+221 77 444 55 66', job: 'Médecin' }
  ]);

  documents = [
    { name: 'Extrait de naissance', size: '1.2 MB', type: 'pdf' },
    { name: 'Bulletins CM2', size: '2.4 MB', type: 'pdf' },
    { name: 'Certificat de scolarité', size: '800 KB', type: 'pdf' },
    { name: "Photo d'identité", size: '500 KB', type: 'image' }
  ];

  timeline = [
    { action: 'Dossier soumis', date: '20 Fév 2024, 14:30', user: 'Parent' },
    { action: 'Paiement vérifié', date: '22 Fév 2024, 09:15', user: 'Comptable' },
    { action: 'Ouverture du dossier', date: '24 Fév 2024, 10:00', user: 'Admin' }
  ];

  // Méthode pour l'icône dynamique selon le type de fichier
  getFileIcon(fileName: string): any {
    if (fileName.includes('Photo')) return FileImage;
    if (fileName.includes('Bulletin')) return FileSpreadsheet;
    return FileText;
  }

  // Exposition des icônes
  readonly ArrowLeft = ArrowLeft;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Printer = Printer;
  readonly Download = Download;
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly FileText = FileText;
  readonly CreditCard = CreditCard;
  readonly Pencil = Pencil;
  readonly MoreVertical = MoreVertical;
  readonly Eye = Eye;
  readonly Plus = Plus;
  readonly MessageSquare = MessageSquare;
  readonly History = History;
  readonly File = File;
  readonly FileImage = FileImage;
  readonly FileSpreadsheet = FileSpreadsheet;
}
