import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  ExternalLink, 
  LucideAngularModule 
} from 'lucide-angular';

import { InAppNotificationService } from '../../../core/services/in-app-notification.service';
import { NotificationResponse } from '../../../core/models/notification.model';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-notification-popover',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SkeletonComponent],
  templateUrl: './notification-popover.component.html',
  styleUrl: './notification-popover.component.scss'
})
export class NotificationPopoverComponent {
  private notificationService = inject(InAppNotificationService);
  private router = inject(Router);

  @Output() actionTaken = new EventEmitter<void>();

  // Icons
  readonly Bell = Bell;
  readonly CheckCheck = CheckCheck;
  readonly Clock = Clock;
  readonly ExternalLink = ExternalLink;

  // Signals for state
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  isLoading = this.notificationService.loading;

  currentPage = signal(0);

  constructor() {
    // Charger l'historique initial
    this.notificationService.loadHistory(0);
  }

  /**
   * Retourne les métadonnées visuelles (icône, couleurs) pour un item
   */
  getMeta(type: any) {
    return this.notificationService.getMetadata(type);
  }

  /**
   * Marque une notification comme lue et redirige si lien présent
   */
  handleAction(notification: NotificationResponse) {
    // 1. Marquer comme lu (Optimiste)
    if (notification.status !== 'READ') {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // 2. Notifier le parent pour fermer le menu
    this.actionTaken.emit();

    // 3. Rediriger avec un léger délai
    // Le délai permet au menu de se fermer proprement sans interrompre le routeur
    const url = this.notificationService.getNotificationUrl(notification);
    if (url) {
      setTimeout(() => {
        this.router.navigateByUrl(url);
      }, 50);
    }
  }

  /**
   * Simule un Infinite Scroll au scroll de la zone
   */
  onScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      // Fin du scroll atteinte
      if (!this.isLoading()) {
        this.currentPage.update(p => p + 1);
        this.notificationService.loadHistory(this.currentPage());
      }
    }
  }

  /**
   * Marque tout comme lu
   */
  markAllAsRead() {
    // API massive à implémenter si besoin
    console.log('Mark all as read');
  }
}
