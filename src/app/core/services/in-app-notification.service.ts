import {inject, Injectable, OnDestroy, signal} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, finalize, map, Observable, of, tap} from 'rxjs';
import {AlertTriangle, Bell, CheckCircle, CreditCard, FilePlus, Info, UserPlus} from 'lucide-angular';

import {EnvironmentService} from './environment.service';
import {AuthService} from './auth.service';
import {NotificationService as ToastService} from '../../shared/services/notification.service';
import {NotificationMetadata, NotificationResponse, NotificationType} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private envService = inject(EnvironmentService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  private readonly API_URL = this.envService.getServiceUrl('notifications');
  private abortController: AbortController | null = null;

  // --- State (Signals) ---
  private _notifications = signal<NotificationResponse[]>([]);
  readonly notifications = this._notifications.asReadonly();

  private _unreadCount = signal<number>(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  private _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  // --- Registry of Notification Types ---
  private readonly METADATA_REGISTRY: Record<NotificationType, NotificationMetadata> = {
    'ADMISSION_SUBMITTED': {
      icon: FilePlus,
      colorClass: 'text-indigo-500',
      bgClass: 'bg-indigo-50'
    },
    'ADMISSION_VALIDATED': {
      icon: CheckCircle,
      colorClass: 'text-emerald-500',
      bgClass: 'bg-emerald-50'
    },
    'PAYMENT_RECEIVED': {
      icon: CreditCard,
      colorClass: 'text-blue-500',
      bgClass: 'bg-blue-50'
    },
    'PAYMENT_REQUESTED': {
      icon: CreditCard,
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-50'
    },
    'CLASS_ASSIGNED': {
      icon: UserPlus,
      colorClass: 'text-indigo-500',
      bgClass: 'bg-indigo-50'
    },
    'GENERAL_INFO': {
      icon: Info,
      colorClass: 'text-slate-500',
      bgClass: 'bg-slate-50'
    },
    'URGENT_ALERT': {
      icon: AlertTriangle,
      colorClass: 'text-rose-500',
      bgClass: 'bg-rose-50'
    }
  };

  constructor() {
    // Initialisation du compteur
    this.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  // --- Real-time (Fetch-based SSE) ---

  /**
   * Établit la connexion au flux via fetch (permet d'envoyer le Header Authorization)
   */
  async connect(): Promise<void> {
    if (this.abortController) return;

    const token = this.authService.getToken();
    const url = `${this.API_URL}/stream`.replace('//stream', '/stream');

    this.abortController = new AbortController();

    try {
      console.log('[NotificationService] 🛰️ Connecting to stream via Fetch...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('[NotificationService] ✅ Stream connected');

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const {value, done} = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {stream: true});

        // Split par double newline (format SSE standard)
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          this.parseEvent(part);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[NotificationService] Stream connection closed.');
      } else {
        console.error('[NotificationService] Stream error:', error);
        // Tentative de reconnexion automatique après 5 secondes
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  private parseEvent(rawEvent: string): void {
    const lines = rawEvent.split('\n');
    let eventType = 'message';
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.replace('event:', '').trim();
      } else if (line.startsWith('data:')) {
        data = line.replace('data:', '').trim();
      }
    }

    if (eventType === 'NOTIFICATION' && data) {
      try {
        const notification = JSON.parse(data) as NotificationResponse;
        this.pushNewNotification(notification);
      } catch (e) {
        console.error('[NotificationService] Error parsing notification data', e);
      }
    }
  }

  /**
   * Ferme la connexion
   */
  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Retourne les métadonnées pour un type de notification donné
   */
  getMetadata(type: NotificationType): NotificationMetadata {
    return this.METADATA_REGISTRY[type] || {
      icon: Bell,
      colorClass: 'text-slate-500',
      bgClass: 'bg-slate-50'
    };
  }

  // --- REST API Actions ---

  /**
   * Charge l'historique des notifications personnelles
   */
  loadHistory(page: number = 0, size: number = 30): void {
    this._loading.set(true);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // On s'assure que le chemin est correct
    const url = `${this.API_URL}/mine`.replace('//mine', '/mine');

    this.http.get<any>(url, {params}).pipe(
      map(res => res.content as NotificationResponse[]),
      tap(list => {
        if (page === 0) {
          this._notifications.set(list);
        } else {
          this._notifications.update(prev => [...prev, ...list]);
        }
      }),
      catchError(err => {
        console.error('[NotificationService] Error loading history at:', url, err);
        return of([]);
      }),
      finalize(() => this._loading.set(false))
    ).subscribe();
  }

  /**
   * Met à jour le compteur des messages non lus
   */
  refreshUnreadCount(): void {
    const url = `${this.API_URL}/unread/count`.replace('//unread', '/unread');
    this.http.get<number>(url).pipe(
      tap(count => this._unreadCount.set(count)),
      catchError(() => of(0))
    ).subscribe();
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(id: string): Observable<void> {
    // Optimistic update
    this._notifications.update(list =>
      list.map(n => n.id === id ? {...n, status: 'READ', readAt: new Date().toISOString()} : n)
    );
    this._unreadCount.update(c => Math.max(0, c - 1));

    const url = `${this.API_URL}/${id}/read`.replace('//' + id, '/' + id);
    return this.http.patch<void>(url, {}).pipe(
      catchError(err => {
        this.refreshUnreadCount();
        throw err;
      })
    );
  }

  /**
   * Ajoute manuellement une notification (ex: reçue via SSE)
   */
  pushNewNotification(notification: NotificationResponse): void {
    this._notifications.update(prev => [notification, ...prev]);
    this._unreadCount.update(c => c + 1);

    // Alerte visuelle via Toastr
    this.toastService.info(notification.subject, 'Notification');
  }
}
