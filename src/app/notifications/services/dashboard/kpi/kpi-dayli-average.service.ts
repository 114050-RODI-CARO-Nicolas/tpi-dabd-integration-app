import { inject, Injectable } from "@angular/core";
import { NotificationService } from "../../notification.service";
import { BehaviorSubject, Observable } from "rxjs";

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
  selectedStatus: 'ALL' | 'SENT' | 'VISUALIZED';
}

interface DailyAverageStats {
  average: number;
  totalNotifications: number;
  totalDays: number;
}

interface Notification {
  dateSend: string;
  statusSend: 'SENT' | 'VISUALIZED';
}

@Injectable({
  providedIn: 'root'
})
export class KpiDailyAverageService {
  private notificationService = inject(NotificationService);

  private notifications: Notification[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null,
    selectedStatus: 'ALL'
  });

  private stats$ = new BehaviorSubject<DailyAverageStats>({
    average: 0,
    totalNotifications: 0,
    totalDays: 0
  });

  getDailyAverage(): Observable<number> {
    return new Observable(observer => {
      this.stats$.subscribe(stats => observer.next(stats.average));
    });
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
    const stats = this.calculateDailyAverage(filteredNotifications);
    this.stats$.next(stats);
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

  private calculateDailyAverage(notifications: Notification[]): DailyAverageStats {
    if (notifications.length === 0) {
      return { average: 0, totalNotifications: 0, totalDays: 0 };
    }

    const uniqueDays = new Set(
      notifications.map(n => this.parseDateToString(this.parseNotificationDate(n.dateSend)))
    );

    const totalDays = uniqueDays.size;
    const totalNotifications = notifications.length;
    const average = totalDays > 0 ? totalNotifications / totalDays : 0;

    return {
      average,
      totalNotifications,
      totalDays
    };
  }

  private parseNotificationDate(dateString: string): Date {
    const [datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  private parseDateToString(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  resetStats(): void {
    this.currentFilter$.next({
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL'
    });
    this.stats$.next({
      average: 0,
      totalNotifications: 0,
      totalDays: 0
    });
  }


}
