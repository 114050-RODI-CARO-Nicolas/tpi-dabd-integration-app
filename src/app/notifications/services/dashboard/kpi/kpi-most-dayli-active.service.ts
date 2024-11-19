import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationService } from '../../notification.service';


export interface ActiveDayStats {
  day: string;
  count: number;
  percentage: number;
}

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class KpiMostDayliActiveService {

  private readonly WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  private notificationService = inject(NotificationService);

  private notifications: any[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null
  });

  private activeDay$ = new BehaviorSubject<ActiveDayStats>({
    day: '',
    count: 0,
    percentage: 0
  });

  getMostActiveDay(): Observable<ActiveDayStats> {
    return this.activeDay$.asObservable();
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
    const stats = this.calculateMostActiveDay(filteredNotifications);
    this.activeDay$.next(stats);
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

  private calculateMostActiveDay(notifications: any[]): ActiveDayStats {

    if (notifications.length === 0) {
      return { day: '', count: 0, percentage: 0 };
    }

    const weekdayCount = new Map<string, number>();
    const totalNotifications = notifications.length;

    this.WEEKDAYS.forEach(day => weekdayCount.set(day, 0));

    notifications.forEach(notification => {
      const date = this.parseNotificationDate(notification.dateSend);
      const weekday = this.WEEKDAYS[date.getDay()];
      weekdayCount.set(weekday, (weekdayCount.get(weekday) || 0) + 1);
    });

    const [mostActiveDay, maxCount] = Array.from(weekdayCount.entries())
      .reduce(([currentDay, currentCount], [day, count]) =>
        count > currentCount ? [day, count] : [currentDay, currentCount],
        ['', 0]
      );

    const percentage = (maxCount / totalNotifications) * 100;

    return {
      day: mostActiveDay,
      count: maxCount,
      percentage
    };

  }

  private parseNotificationDate(dateString: string): Date {
    const [datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  resetStats(): void {
    this.activeDay$.next({
      day: '',
      count: 0,
      percentage: 0
    });
  }
}
