import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { ChartData, ChartOptions } from 'chart.js';
import { SubscriptionService } from '../../subscription.service';
import { ContactService } from '../../contact.service';

interface SubscriptionStat {
  subscribed: number;
  unsubscribed: number;
  total: number;
}

interface SubscriptionAnalysisMetric {
  subscriptionName: string;
  subscribed: number;
  unsubscribed: number;
}

interface AnalysisChartState {
  data: ChartData<'bar'>;
  options: ChartOptions<'bar'>;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionOptionalAnalysisMetricService {

  private contactService = inject(ContactService);
  private subscriptionService = inject(SubscriptionService);

  private readonly CHART_COLORS = {
    subscribed: {
      background: '#36A2EB',
      border: '#36A2EB'
    },
    unsubscribed: {
      background: '#FF6384',
      border: '#FF6384'
    }
  };

  private chartState$ = new BehaviorSubject<AnalysisChartState>({
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          label: 'Suscritos',
          backgroundColor: this.CHART_COLORS.subscribed.background,
          borderColor: this.CHART_COLORS.subscribed.border,
          borderWidth: 1
        },
        {
          data: [],
          label: 'Desuscritos',
          backgroundColor: this.CHART_COLORS.unsubscribed.background,
          borderColor: this.CHART_COLORS.unsubscribed.border,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Análisis de Suscripciones Opcionales',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: { bottom: 20 }
        }
      },
      scales: {
        x: {
          stacked: false,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            text: 'Cantidad de Usuarios',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          border: {
            display: true
          }
        },
        y: {
          stacked: false,
          grid: {
            display: false
          },
          title: {
            display: true,
            text: 'Tipos de Suscripción',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          border: {
            display: true
          }
        }
      }
    }
  });

  getChartData(): Observable<ChartData<'bar'>> {
    return new Observable(observer => {
      observer.next(this.chartState$.value.data);
      this.chartState$.subscribe(state => observer.next(state.data));
    });
  }

  getChartOptions(): ChartOptions<'bar'> {
    return this.chartState$.value.options;
  }

  loadData(): void {
    forkJoin({
      contacts: this.contactService.getAllContacts(),
      subscriptions: this.subscriptionService.getAllSubscriptions()
    }).subscribe({
      next: ({ contacts, subscriptions }) => {
        this.processSubscriptionData(contacts, subscriptions);
      },
      error: (error) => {
        console.error('Error loading subscription analysis data:', error);
        this.resetData();
      }
    });
  }

  private processSubscriptionData(contacts: any[], subscriptionTypes: any[]): void {
    const optionalSubs = subscriptionTypes
      .filter(sub => sub.isUnsubscribable)
      .map(sub => sub.name);

    const subscriptionStats = this.calculateSubscriptionStats(contacts, optionalSubs);
    const sortedStats = this.sortSubscriptionStats(subscriptionStats);
    this.updateChartData(sortedStats);
  }

  private calculateSubscriptionStats(contacts: any[], optionalSubs: string[]): Record<string, SubscriptionStat> {
    const stats: Record<string, SubscriptionStat> = {};
    const activeContacts = contacts.filter(contact => contact.active);
    const totalContacts = activeContacts.length;

    optionalSubs.forEach(subName => {
      stats[subName] = { subscribed: 0, unsubscribed: 0, total: totalContacts };
    });

    activeContacts.forEach(contact => {
      optionalSubs.forEach(subName => {
        if (contact.subscriptions.includes(subName)) {
          stats[subName].subscribed++;
        } else {
          stats[subName].unsubscribed++;
        }
      });
    });

    return stats;
  }

  private sortSubscriptionStats(stats: Record<string, SubscriptionStat>): [string, SubscriptionStat][] {
    return Object.entries(stats)
      .sort(([, a], [, b]) => b.subscribed - a.subscribed);
  }

  private updateChartData(sortedStats: [string, SubscriptionStat][]): void {
    const newState = {
      ...this.chartState$.value,
      data: {
        labels: sortedStats.map(([name]) =>
          this.subscriptionService.getSubscriptionNameInSpanish(name)
        ),
        datasets: [
          {
            ...this.chartState$.value.data.datasets[0],
            data: sortedStats.map(([, stats]) => stats.subscribed)
          },
          {
            ...this.chartState$.value.data.datasets[1],
            data: sortedStats.map(([, stats]) => stats.unsubscribed)
          }
        ]
      }
    };

    this.chartState$.next(newState);
  }

  resetData(): void {
    const emptyState = {
      ...this.chartState$.value,
      data: {
        labels: [],
        datasets: this.chartState$.value.data.datasets.map(dataset => ({
          ...dataset,
          data: []
        }))
      }
    };

    this.chartState$.next(emptyState);
  }
}
