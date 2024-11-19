import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from '../../notification.service';


export interface PeakHourStats {
  hour: number;
  count: number;
}

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class KpiPeakTimeService {
  private notificationService = inject(NotificationService);

  private notifications: any[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null
  });

  private peakHourStats$ = new BehaviorSubject<PeakHourStats>({
    hour: 0,
    count: 0
  });

  getPeakHourStats(): Observable<PeakHourStats> {
    return this.peakHourStats$.asObservable();
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
    const stats = this.calculatePeakHour(filteredNotifications);
    this.peakHourStats$.next(stats);
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

  private calculatePeakHour(notifications: any[]): PeakHourStats {
    if (notifications.length === 0) {
      return { hour: 0, count: 0 };
    }

    const hourCount = new Map<number, number>();

    notifications.forEach(notification => {
      const hour = parseInt(notification.dateSend.split(' ')[1].split(':')[0]);
      hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
    });

    const peakHour = Array.from(hourCount.entries())
      .reduce((peak, [hour, count]) =>
        count > peak.count ? { hour, count } : peak,
        { hour: 0, count: 0 }
      );

    return peakHour;
  }

  private parseNotificationDate(dateString: string): Date {
    const [datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  resetStats(): void {
    this.peakHourStats$.next({
      hour: 0,
      count: 0
    });
  }
}
