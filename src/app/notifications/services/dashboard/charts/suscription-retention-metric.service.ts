import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SubscriptionService } from '../../subscription.service';
import { ContactService } from '../../contact.service';
import { RetentionMetric } from '../../../models/kpi/kpiModel';
import { ChartData, ChartOptions } from 'chart.js';

interface RetentionChartState {
  data: ChartData<'bar'>;
  options: ChartOptions<'bar'>;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionRetentionMetricService {

  private chartState$ = new BehaviorSubject<RetentionChartState>({
    data: {
      labels: [],
      datasets: [{
        data: [],
        label: 'Tasa de Retención (%)',
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
        borderWidth: 1,
        barThickness: 20,
        barPercentage: 2,
        categoryPercentage: 0.9 
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 20,
          right: 20
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Tasa de Retención de Notificaciones Opcionales'
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Porcentaje de Retención'
          }
        },
        y: {
          ticks: {
            padding: 10
          }
        }
      }
    }
  });

  constructor(
    private subscriptionService: SubscriptionService,
    private contactService: ContactService
  ) { }

  getChartData(): Observable<ChartData<'bar'>> {
    return this.chartState$.pipe(map(state => state.data));
  }

  getChartOptions(): ChartOptions<'bar'> {
    return this.chartState$.value.options;
  }

  loadData(): Observable<void> {
    return forkJoin({
      subscriptionTypes: this.subscriptionService.getAllSubscriptions(),
      contacts: this.contactService.getAllContacts()
    }).pipe(
      map(({ subscriptionTypes, contacts }) => {
        const retentionMetrics = this.calculateRetentionMetrics(contacts, subscriptionTypes);
        this.updateChartData(retentionMetrics);
      }),
      catchError((error) => {
        console.error('Error loading retention metrics:', error);
        this.resetData();
        throw error;
      })
    );
  }

  private calculateRetentionMetrics(contacts: any[], subscriptionTypes: any[]): RetentionMetric[] {
    const optionalSubs = subscriptionTypes
      .filter(sub => sub.isUnsubscribable)
      .map(sub => sub.name);

    const totalUsers = contacts.filter(contact => contact.active).length;
    return optionalSubs.map(subName => {
      const activeUsers = contacts.filter(contact =>
        contact.active && contact.subscriptions.includes(subName)
      ).length;

      return {
        subscriptionName: subName,
        totalUsers,
        activeUsers,
        retentionRate: (activeUsers / totalUsers) * 100
      };
    });
  }


 private updateChartData(metrics: RetentionMetric[]): void {
  const newState = {
    ...this.chartState$.value,
    data: {
      labels: metrics.map(m => this.subscriptionService.getSubscriptionNameInSpanish(m.subscriptionName)),
      datasets: [{
        ...this.chartState$.value.data.datasets[0],
        data: metrics.map(m => m.retentionRate)
      }]
    }
  };

  this.chartState$.next(newState);
}

  resetData(): void {
    const emptyState = {
      ...this.chartState$.value,
      data: {
        labels: [],
        datasets: [{
          ...this.chartState$.value.data.datasets[0],
          data: []
        }]
      }
    };

    this.chartState$.next(emptyState);
  }
}
