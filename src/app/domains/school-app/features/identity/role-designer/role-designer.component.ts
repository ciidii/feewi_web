import { Component, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldCheck, ShieldAlert, Shield, Save, Plus, ChevronRight, Check, X } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface Permission {
  id: string;
  label: string;
  description: string;
  granted: boolean;
}

export interface PermissionGroup {
  category: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-role-designer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatButtonModule, MatSlideToggleModule],
  templateUrl: './role-designer.component.html',
  styleUrl: './role-designer.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class RoleDesignerComponent {
  readonly Save = Save;
  readonly Plus = Plus;
  readonly ChevronRight = ChevronRight;
  readonly Shield = Shield;
  readonly ShieldCheck = ShieldCheck;

  roles = [
    { id: '1', name: 'Administrateur École', icon: ShieldCheck, memberCount: 3 },
    { id: '2', name: 'Comptable', icon: Shield, memberCount: 2 },
    { id: '3', name: 'Enseignant', icon: Shield, memberCount: 15 },
    { id: '4', name: 'Surveillant', icon: ShieldAlert, memberCount: 4 }
  ];

  selectedRole = signal(this.roles[0]);

  permissionGroups: PermissionGroup[] = [
    {
      category: 'Scolarité & Workflow',
      permissions: [
        { id: '1', label: 'Consultation Référentiel', description: `Voir la liste des élèves et leurs informations de base.`, granted: true },
        { id: '2', label: 'Édition Dossiers', description: `Modifier les informations d'état civil et les pièces jointes.`, granted: true },
        { id: '3', label: 'Validation Admission', description: `Approuver les nouveaux inscrits et assigner une classe.`, granted: false },
        { id: '10', label: 'Gestion Absences', description: `Saisir et justifier les absences journalières.`, granted: true }
      ]
    },
    {
      category: 'Gestion Financière',
      permissions: [
        { id: '4', label: 'Encaissement Frais', description: `Enregistrer les paiements et générer des factures.`, granted: false },
        { id: '5', label: 'Rapports de Caisse', description: `Consulter les bilans et l'historique des transactions.`, granted: false },
        { id: '11', label: 'Gestion Bourses', description: `Appliquer des remises ou des exonérations.`, granted: false }
      ]
    },
    {
      category: 'Système & Sécurité',
      permissions: [
        { id: '6', label: 'Annuaire Staff', description: `Gérer les comptes utilisateurs des collaborateurs.`, granted: false },
        { id: '7', label: 'Configuration Niveaux', description: `Définir la structure des classes et des cycles.`, granted: true },
        { id: '12', label: 'Audit Trail', description: `Consulter le journal des actions de sécurité.`, granted: false }
      ]
    }
  ];
}
