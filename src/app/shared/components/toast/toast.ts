import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';
import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Toast, ToastPackage, ToastrService} from 'ngx-toastr';
import {AlertTriangle, CheckCircle, Info, LucideAngularModule, X, XCircle} from 'lucide-angular';

@Component({
  selector: 'app-fw-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast.html',
  styleUrls: ['./toast.scss'],
  animations: [
    trigger('flyInOut', [
      state('inactive', style({ opacity: 0 })),
      transition('inactive => active', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', keyframes([
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        style({ transform: 'translateY(0)', opacity: 1 })
      ]))),
      transition('active => removed', animate('200ms ease-in', keyframes([
        style({ transform: 'translateX(20px)', opacity: 0 })
      ])))
    ])
  ],
  preserveWhitespaces: false,
})
export class ToastComponent extends Toast {
  // Icônes Lucide
  readonly CheckCircle = CheckCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly XCircle = XCircle;
  readonly Info = Info;
  readonly X = X;

  // Récupérer les services via inject() pour la compatibilité
  protected override toastrService = inject(ToastrService);
  public override toastPackage = inject(ToastPackage);

  constructor() {
    super();
  }

  getIcon() {
    const type = this.toastPackage.toastType;
    if (type === 'toast-success') return this.CheckCircle;
    if (type === 'toast-error') return this.XCircle;
    if (type === 'toast-warning') return this.AlertTriangle;
    return this.Info;
  }

  getTypeClass() {
    return this.toastPackage.toastType.replace('toast-', '');
  }
}
