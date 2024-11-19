import { inject, Injectable } from "@angular/core";
import { NotificationService } from "../../notification.service";
import { BehaviorSubject, Observable } from "rxjs";

export interface PeakHourStats {
  hour: number;
  count: number;
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
export class KpiPeakTimeService {
  private notificationService = inject(NotificationService);

  private notifications: Notification[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null,
    selectedStatus: 'ALL'
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

  updateFilters(filter: Partial<DateFilter>): void {
    this.currentFilter$.next({
      ...this.currentFilter$.value,
      ...filter
    });
    this.updateStats();
  }

  private updateStats(): void {
    const filteredNotifications = this.applyFilters(this.notifications);
    const stats = this.calculatePeakHour(filteredNotifications);
    this.peakHourStats$.next(stats);
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

  private calculatePeakHour(notifications: Notification[]): PeakHourStats {
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
    this.currentFilter$.next({
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL'
    });
    this.peakHourStats$.next({
      hour: 0,
      count: 0
    });
  }


}
