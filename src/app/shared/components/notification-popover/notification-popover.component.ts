import { Component, inject, signal } from '@angular/core';
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
    if (notification.status !== 'READ') {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    if (notification.link) {
      this.router.navigateByUrl(notification.link);
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
