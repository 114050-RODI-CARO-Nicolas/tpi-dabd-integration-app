import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChartData, ChartOptions } from 'chart.js';
import { NotificationService } from '../../notification.service';
import { NotificationKPIViewedModel } from '../../../models/notifications/notification';

interface WeeklyChartState {
  data: ChartData<'bar'>;
  options: ChartOptions<'bar'>;
}

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
  selectedStatus: 'ALL' | 'SENT' | 'VISUALIZED';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWeeklyMetricService {
  private notificationService = inject(NotificationService);
  private readonly WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null,
    selectedStatus: 'ALL'
  });

  private chartState$ = new BehaviorSubject<WeeklyChartState>({
    data: {
      labels: this.WEEKDAYS,
      datasets: [{
        data: Array(7).fill(0),
        label: 'Notificaciones por Día',
        backgroundColor: 'rgba(149, 160, 217, 0.8)',
        borderColor: 'rgba(149, 160, 217, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(149, 160, 217, 1)',
        barThickness: 'flex',
        maxBarThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => `Cantidad: ${context.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          border: {
            display: true
          },
          title: {
            display: true,
            text: 'Día de la Semana',
            padding: { top: 10 },
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          beginAtZero: true,
          border: {
            display: true
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            text: 'Cantidad de Notificaciones',
            padding: { bottom: 10 },
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          ticks: {
            stepSize: 1,
            precision: 0
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animation: {
        duration: 750
      }
    }
  });

  loadData(): void {
    this.notificationService.getAllNotificationsNotFiltered()
      .subscribe({
        next: (notifications) => {
          const filteredNotifications = this.applyFilters(notifications);
          this.updateChartData(filteredNotifications);
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.resetData();
        }
      });
  }

  updateFilters(filter: Partial<DateFilter>): void {
    this.currentFilter$.next({
      ...this.currentFilter$.value,
      ...filter
    });
    this.loadData();
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

  private dateFilter(notification: NotificationKPIViewedModel, dateFrom: string | null, dateUntil: string | null): boolean {
    if (!dateFrom && !dateUntil) return true;

    const notificationDate = this.parseNotificationDate(notification.dateSend);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const untilDate = dateUntil ? new Date(dateUntil) : null;

    return (!fromDate || notificationDate >= fromDate) &&
           (!untilDate || notificationDate <= untilDate);
  }

  resetData(): void {
    this.currentFilter$.next({
      dateFrom: null,
      dateUntil: null,
      selectedStatus: 'ALL'
    });

    const emptyState = {
      ...this.chartState$.value,
      data: {
        ...this.chartState$.value.data,
        datasets: [{
          ...this.chartState$.value.data.datasets[0],
          data: Array(7).fill(0)
        }]
      }
    };

    this.chartState$.next(emptyState);
  }

  getChartData(): Observable<ChartData<'bar'>> {
    return new Observable(observer => {
      observer.next(this.chartState$.value.data);
      this.chartState$.subscribe(state => observer.next(state.data));
    });
  }

  getChartOptions(): ChartOptions<'bar'> {
    return this.chartState$.value.options;
  }

  updateChartData(notifications: NotificationKPIViewedModel[]): void {
    const weekdayCount = this.calculateWeekdayCounts(notifications);

    const newChartState = {
      ...this.chartState$.value,
      data: {
        ...this.chartState$.value.data,
        datasets: [{
          ...this.chartState$.value.data.datasets[0],
          data: this.WEEKDAYS.map(day => weekdayCount.get(day) || 0)
        }]
      }
    };

    this.chartState$.next(newChartState);
  }

  private calculateWeekdayCounts(notifications: NotificationKPIViewedModel[]): Map<string, number> {
    const weekdayCount = new Map<string, number>();

    notifications.forEach(notification => {
      const date = this.parseNotificationDate(notification.dateSend);
      const weekday = this.WEEKDAYS[date.getDay()];
      weekdayCount.set(weekday, (weekdayCount.get(weekday) || 0) + 1);
    });

    return weekdayCount;
  }

  private parseNotificationDate(dateString: string): Date {
    const [day, month, year] = dateString.split(' ')[0].split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
}
