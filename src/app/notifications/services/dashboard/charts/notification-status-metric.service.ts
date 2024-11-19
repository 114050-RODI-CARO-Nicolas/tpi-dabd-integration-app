import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartConfigurationService } from './chart-configuration.service';
import { NotificationService } from '../../notification.service';

export interface FilterCriteria {
  dateFrom: string | null;
  dateUntil: string | null;
  selectedStatus: 'ALL' | 'SENT' | 'VISUALIZED';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationStatusMetricService {

  private notifications$ = new BehaviorSubject<any[]>([]);
  private filterCriteria$ = new BehaviorSubject<FilterCriteria>({
    dateFrom: null,
    dateUntil: null,
    selectedStatus: 'ALL'
  });

  private chartData$ = new BehaviorSubject<ChartData<'pie'>>({
    labels: ['Enviadas', 'Vistas'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(75, 192, 192, 0.8)'],
      hoverBackgroundColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)']
    }]
  });

  constructor(
    private chartConfigurationService: ChartConfigurationService,
    private notificationService: NotificationService
  ) {
    this.initializeDataSubscription();
  }

  private initializeDataSubscription(): void {
    combineLatest([
      this.notifications$,
      this.filterCriteria$.pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
    ]).subscribe(([notifications, criteria]) => {
      const filteredData = this.applyFilters(notifications, criteria);
      this.updateChartData(filteredData);
    });
  }

  private applyFilters(notifications: any[], criteria: FilterCriteria): any[] {
    return notifications.filter(notification => {
      const matchesDate = this.dateFilter(notification, criteria.dateFrom, criteria.dateUntil);
      const matchesStatus = criteria.selectedStatus === 'ALL' ?
        true : notification.statusSend === criteria.selectedStatus;

      return matchesDate && matchesStatus;
    });
  }

  private dateFilter(notification: any, dateFrom: string | null, dateUntil: string | null): boolean {
    
    if (!dateFrom && !dateUntil) return true;

    const notificationDate = new Date(this.convertToISODate(notification.dateSend));
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const untilDate = dateUntil ? new Date(dateUntil) : null;

    return (!fromDate || notificationDate >= fromDate) &&
      (!untilDate || notificationDate <= untilDate);
  }

  private convertToISODate(dateString: string) {
    const [dateOnly, timeOnly] = dateString.split(' ');
    const [day, month, year] = dateOnly.split('/');
    const [hours, minutes, seconds] = timeOnly.split(':');
    const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}Z`;
    return isoDateString;
  }

  private updateChartData(filteredNotifications: any[]): void {
    const statusCount = {
      SENT: filteredNotifications.filter(n => n.statusSend === 'SENT').length,
      VISUALIZED: filteredNotifications.filter(n => n.statusSend === 'VISUALIZED').length
    };

    const newChartData = {
      ...this.chartData$.value,
      datasets: [{
        ...this.chartData$.value.datasets[0],
        data: [statusCount.SENT, statusCount.VISUALIZED]
      }]
    };

    this.chartData$.next(newChartData);
  }

  getChartData(): Observable<ChartData<'pie'>> {
    return this.chartData$.asObservable();
  }

  getChartOptions(): ChartOptions<'pie'> {
    return this.chartConfigurationService.getPieChartOptions();
  }

  updateFilters(filters: Partial<FilterCriteria>): void {
    this.filterCriteria$.next({
      ...this.filterCriteria$.value,
      ...filters
    });
  }

  resetFilters(): void {
    this.filterCriteria$.next({
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL',
    });
  }

  loadNotifications(): void {
    this.notificationService.getAllNotificationsNotFiltered()
      .subscribe(data => this.notifications$.next(data));
  }

  getActiveFiltersCount(): number {
    const criteria = this.filterCriteria$.value;
    let count = 0;
    if (criteria.dateFrom) count++;
    if (criteria.dateUntil) count++;
    if (criteria.selectedStatus !== 'ALL') count++;
    return count;
  }
}
