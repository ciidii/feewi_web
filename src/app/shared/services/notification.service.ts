import {inject, Injectable} from '@angular/core';
import {ActiveToast, ToastrService} from 'ngx-toastr';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastr = inject(ToastrService);

  /**
   * Affiche une notification de succès
   */
  success(message: string, title: string = 'Succès'): ActiveToast<any> {
    return this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification d'erreur
   */
  error(message: string, title: string = 'Erreur'): ActiveToast<any> {
    return this.toastr.error(message, title, {
      timeOut: 5000,
      progressBar: true,
      positionClass: 'toast-top-right',
      disableTimeOut: false
    });
  }

  /**
   * Affiche une notification d'avertissement
   */
  warning(message: string, title: string = 'Attention'): ActiveToast<any> {
    return this.toastr.warning(message, title, {
      timeOut: 4000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification d'information
   */
  info(message: string, title: string = 'Information'): ActiveToast<any> {
    return this.toastr.info(message, title, {
      timeOut: 3000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification personnalisée
   */
  show(type: NotificationType, message: string, title?: string): ActiveToast<any> {
    return this[type](message, title);
  }

  /**
   * Efface toutes les notifications
   */
  clear(): void {
    this.toastr.clear();
  }
}
