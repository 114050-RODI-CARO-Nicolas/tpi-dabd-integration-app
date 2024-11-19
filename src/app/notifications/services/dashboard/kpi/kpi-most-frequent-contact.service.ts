import { BehaviorSubject, Observable } from "rxjs";
import { NotificationService } from "../../notification.service";
import { inject, Injectable } from "@angular/core";

export interface FrequentContactStats {
  email: string;
  count: number;
}

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
  selectedStatus: 'ALL' | 'SENT' | 'VISUALIZED';
}

interface Notification {
  dateSend: string;
  recipient: string;
  statusSend: 'SENT' | 'VISUALIZED';
}

@Injectable({
  providedIn: 'root'
})
export class KpiMostFrequentContactService {
  private notificationService = inject(NotificationService);

  private notifications: Notification[] = [];
  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null,
    selectedStatus: 'ALL'
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

  updateFilters(filter: Partial<DateFilter>): void {
    this.currentFilter$.next({
      ...this.currentFilter$.value,
      ...filter
    });
    this.updateStats();
  }

  private updateStats(): void {
    const filteredNotifications = this.applyFilters(this.notifications);
    const stats = this.calculateMostFrequentContact(filteredNotifications);
    this.frequentContact$.next(stats);
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

  private calculateMostFrequentContact(notifications: Notification[]): FrequentContactStats {
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
    this.currentFilter$.next({
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL'
    });
    this.frequentContact$.next({
      email: '',
      count: 0
    });
  }

}
