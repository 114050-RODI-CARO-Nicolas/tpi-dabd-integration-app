import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';

@Injectable({
  providedIn: 'root'
})
export class ChartConfigurationService {

  private readonly defaultPieChartOptions: ChartOptions<'pie'> = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },


      title: {
        display: false
      },


      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}`;
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };


  getPieChartOptions(customOptions?: Partial<ChartOptions<'pie'>>): ChartOptions<'pie'> {
    return {
      ...this.defaultPieChartOptions,
      ...customOptions
    };
  }

  public commonOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        }
      }
    }
  };

  public statusChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Enviados', 'Visualizados'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
    }]
  };


  public statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: false
      }
    }
  };

  public templateChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Cantidad de Usos',
      backgroundColor: '#36A2EB'
    }]
  };


  public templateChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 4,
          precision: 0
        },
        grid: {
          color: '#e9ecef'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  public dailyChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Notificaciones Enviadas',
      fill: false,
      tension: 0.1,
      borderColor: '#36A2EB',
      backgroundColor: '#36A2EB',
      pointBackgroundColor: '#36A2EB',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#36A2EB'
    }]
  };

  public dailyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        },
        grid: {
          color: '#e9ecef'
        }
      },
      x: {
        grid: {
          color: '#e9ecef'
        }
      }
    }
  };


  getContactTypeChartOptions(): ChartOptions<'pie'> {
    return this.getPieChartOptions({
      plugins: {
        ...this.defaultPieChartOptions.plugins,
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }




}
