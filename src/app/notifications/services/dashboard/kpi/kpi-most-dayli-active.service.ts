import { inject, Injectable } from "@angular/core";
import { NotificationService } from "../../notification.service";
import { BehaviorSubject, Observable } from "rxjs";

export interface ActiveDayStats {
  day: string;
  count: number;
  percentage: number;
}

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
  selectedStatus: 'ALL' | 'SENT' | 'VISUALIZED';
}

interface Notification {
  dateSend: string;
  statusSend: 'SENT' | 'VISUALIZED';
}

@Injectable({
  providedIn: 'root'
})
export class KpiMostDayliActiveService {
  private readonly WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  private notificationService = inject(NotificationService);

  private notifications: Notification[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null,
    selectedStatus: 'ALL'
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

  updateFilters(filter: Partial<DateFilter>): void {
    this.currentFilter$.next({
      ...this.currentFilter$.value,
      ...filter
    });
    this.updateStats();
  }

  private updateStats(): void {
    const filteredNotifications = this.applyFilters(this.notifications);
    const stats = this.calculateMostActiveDay(filteredNotifications);
    this.activeDay$.next(stats);
  }

  private applyFilters(notifications: Notification[]): Notification[] {
    const filter = this.currentFilter$.value;

    return notifications.filter(notification => {
      const matchesDate = this.dateFilter(notification, filter.dateFrom, filter.dateUntil);
      const matchesStatus = filter.selectedStatus === 'ALL' ?
        true : notification.statusSend === filter.selectedStatus;

      return matchesDate && matchesStatus;
    });
  }

  private dateFilter(notification: Notification, dateFrom: string | null, dateUntil: string | null): boolean {
    if (!dateFrom && !dateUntil) return true;

    const notificationDate = this.parseNotificationDate(notification.dateSend);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const untilDate = dateUntil ? new Date(dateUntil) : null;

    return (!fromDate || notificationDate >= fromDate) &&
      (!untilDate || notificationDate <= untilDate);
  }

  private calculateMostActiveDay(notifications: Notification[]): ActiveDayStats {
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
    this.currentFilter$.next({
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL'
    });
    this.activeDay$.next({
      day: '',
      count: 0,
      percentage: 0
    });
  }
}
