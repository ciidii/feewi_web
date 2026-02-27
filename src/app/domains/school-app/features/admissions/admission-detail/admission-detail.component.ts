import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle, Printer, Download, User, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatButtonModule, RouterModule],
  templateUrl: './admission-detail.component.html',
  styleUrl: './admission-detail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdmissionDetailComponent {
  student = signal({ id: 'ADM-2024-001', name: 'Jean Dupont' });

  documents = [
    { name: 'Extrait de naissance', size: '1.2 MB' },
    { name: 'Bulletins CM2', size: '2.4 MB' },
    { name: 'Certificat de scolarité', size: '800 KB' },
    { name: "Photo d'identité", size: '500 KB' }
  ];

  timeline = [
    { action: 'Dossier soumis', date: '20 Fév 2024, 14:30', user: 'Parent' },
    { action: 'Paiement vérifié', date: '22 Fév 2024, 09:15', user: 'Comptable' },
    { action: 'Ouverture du dossier', date: '24 Fév 2024, 10:00', user: 'Admin' }
  ];

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
}
