import {inject, Injectable} from '@angular/core';
import {ToastrService} from 'ngx-toastr';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastr = inject(ToastrService);

  /**
   * Affiche une notification de succès
   */
  success(message: string, title: string = 'Succès'): void {
    this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification d'erreur
   */
  error(message: string, title: string = 'Erreur'): void {
    this.toastr.error(message, title, {
      timeOut: 5000,
      progressBar: true,
      positionClass: 'toast-top-right',
      disableTimeOut: false
    });
  }

  /**
   * Affiche une notification d'avertissement
   */
  warning(message: string, title: string = 'Attention'): void {
    this.toastr.warning(message, title, {
      timeOut: 4000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification d'information
   */
  info(message: string, title: string = 'Information'): void {
    this.toastr.info(message, title, {
      timeOut: 3000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification personnalisée
   */
  show(type: NotificationType, message: string, title?: string): void {
    this[type](message, title);
  }

  /**
   * Efface toutes les notifications
   */
  clear(): void {
    this.toastr.clear();
  }
}
