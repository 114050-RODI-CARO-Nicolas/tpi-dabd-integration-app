import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from '../../notification.service';

export interface FrequentContactStats {
  email: string;
  count: number;
}

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class KpiMostFrequentContactService {

  private notificationService = inject(NotificationService);

  private notifications: any[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null
  });

  private frequentContact$ = new BehaviorSubject<FrequentContactStats>({
    email: '',
    count: 0
  });

  getFrequentContactStats(): Observable<FrequentContactStats> {
    return this.frequentContact$.asObservable();
  }

  loadNotifications(): void {
    this.notificationService.getAllNotificationsNotFiltered()
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.updateStats();
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.resetStats();
        }
      });
  }

  updateDateFilter(filter: DateFilter): void {
    this.currentFilter$.next(filter);
    this.updateStats();
  }

  private updateStats(): void {
    const filteredNotifications = this.applyDateFilter(this.notifications);
    const stats = this.calculateMostFrequentContact(filteredNotifications);
    this.frequentContact$.next(stats);
  }

  private applyDateFilter(notifications: any[]): any[] {
    const filter = this.currentFilter$.value;

    if (!filter.dateFrom && !filter.dateUntil) {
      return notifications;
    }

    return notifications.filter(notification => {
      const notificationDate = this.parseNotificationDate(notification.dateSend);
      const fromDate = filter.dateFrom ? new Date(filter.dateFrom) : null;
      const untilDate = filter.dateUntil ? new Date(filter.dateUntil) : null;

      return (!fromDate || notificationDate >= fromDate) &&
        (!untilDate || notificationDate <= untilDate);
    });
  }

  private calculateMostFrequentContact(notifications: any[]): FrequentContactStats {
    if (notifications.length === 0) {
      return { email: '', count: 0 };
    }

    const contactCount = new Map<string, number>();

    notifications.forEach(notification => {
      const email = notification.recipient;
      contactCount.set(email, (contactCount.get(email) || 0) + 1);
    });

    const mostFrequent = Array.from(contactCount.entries())
      .reduce((most, [email, count]) =>
        count > most.count ? { email, count } : most,
        { email: '', count: 0 }
      );

    return mostFrequent;
  }

  private parseNotificationDate(dateString: string): Date {
    const [datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  resetStats(): void {
    this.frequentContact$.next({
      email: '',
      count: 0
    });
  }
}
