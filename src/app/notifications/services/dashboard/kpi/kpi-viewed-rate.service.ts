import { inject, Injectable } from "@angular/core";
import { NotificationKPIViewedModel } from "../../../models/notifications/notification";
import { BehaviorSubject, map, Observable } from "rxjs";
import { NotificationService } from "../../notification.service";

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
  selectedStatus: 'ALL' | 'SENT' | 'VISUALIZED';
}

interface NotificationStats {
  total: number;
  viewed: number;
  viewedRate: number;
  dateRange: DateFilter;
}

@Injectable({
  providedIn: 'root'
})
export class KpiViewedRateService {
  private notificationService = inject(NotificationService);

  private notifications: NotificationKPIViewedModel[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null,
    selectedStatus: 'ALL'
  });

  private stats$ = new BehaviorSubject<NotificationStats>({
    total: 0,
    viewed: 0,
    viewedRate: 0,
    dateRange: {
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL'
    }
  });


  getViewedStats(): Observable<NotificationStats> {
    return this.stats$.asObservable();
  }

  getViewedRate(): Observable<number> {
    return this.stats$.pipe(
      map(stats => stats.viewedRate)
    );
  }

  loadNotificationStats(): void {
    this.notificationService.getAllNotificationsNotFiltered()
      .subscribe({
        next: (notifications: NotificationKPIViewedModel[]) => {
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
    const stats = this.calculateStats(filteredNotifications);
    this.stats$.next({
      ...stats,
      dateRange: this.currentFilter$.value
    });
  }

  private applyFilters(notifications: NotificationKPIViewedModel[]): NotificationKPIViewedModel[] {
    const filter = this.currentFilter$.value;

    return notifications.filter(notification => {
      const matchesDate = this.dateFilter(notification, filter.dateFrom, filter.dateUntil);
      const matchesStatus = filter.selectedStatus === 'ALL' ?
        true : notification.statusSend === filter.selectedStatus;

      return matchesDate && matchesStatus;
    });
  }

  private dateFilter(notification: any, dateFrom: string | null, dateUntil: string | null): boolean {
    if (!dateFrom && !dateUntil) return true;

    const notificationDate = this.parseNotificationDate(notification.dateSend);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const untilDate = dateUntil ? new Date(dateUntil) : null;

    return (!fromDate || notificationDate >= fromDate) &&
      (!untilDate || notificationDate <= untilDate);
  }

  private parseNotificationDate(dateString: string): Date {
    const [datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  private calculateStats(notifications: NotificationKPIViewedModel[]): NotificationStats {
    const total = notifications.length;
    const viewed = notifications.filter(n => n.statusSend === 'SENT').length;

    return {
      total,
      viewed,
      viewedRate: total > 0 ? (viewed / total) * 100 : 0,
      dateRange: this.currentFilter$.value
    };
  }

  resetStats(): void {
    this.currentFilter$.next({
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL'
    });
    this.stats$.next({
      total: 0,
      viewed: 0,
      viewedRate: 0,
      dateRange: {
        dateFrom: null,
        dateUntil: null,
        selectedStatus: 'ALL'
      }
    });
  }

}
