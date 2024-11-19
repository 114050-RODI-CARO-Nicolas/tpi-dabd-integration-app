import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { NgPipesModule } from 'ngx-pipes';
import {
  BarController,
  BubbleController,
  ChartData,
  ChartType,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  ChartOptions,
  Chart
} from 'chart.js';
import { DatePipe } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryData } from '../../../../models/report-period/category-data';
import { DataDetails } from '../../../../models/report-period/data-details';
Chart.register(BarController, PieController, RadarController, LineController, PolarAreaController, DoughnutController, BubbleController, ScatterController);


@Component({
  selector: 'app-expenses-periods-graphic-bar',
  templateUrl: './expenses-periods-graphic-bar.component.html',
  styleUrls: ['./expenses-periods-graphic-bar.component.css'],  standalone: true,
  imports: [ NgPipesModule,BaseChartDirective],
  providers: [DatePipe, NgbActiveModal],
})
export class ExpensesPeriodsGraphicBarComponent implements OnChanges  {
  @Input() ordinary: CategoryData[] = [];
  @Input() extraordinary: CategoryData[] = [];
  @Input() type: "Monto" | "Promedio" | "Porcentaje" = "Monto";

  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  chartType: ChartType = 'bar';
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      title: {
        display: true,
        text: 'Comparación de Ordinarias y Extraordinarias',
      },

      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}`,
        },
      }
    },
  };

  ngOnChanges(changes: SimpleChanges) {
    // Comprobar si alguna de las entradas ha cambiado y actualizar los datos
    if (changes['ordinary'] || changes['extraordinary'] || changes['type']) {
      this.prepareChartData();
    }
  }

  prepareChartData() {
    let reportMap = new Map<string, Report>();

    // Procesar la listado 'ordinary'
    this.ordinary.map((ord) => {
      let category = ord.category;
      let amount = this.getValueByType(ord.data); // Usamos la función que determina el valor según el tipo

      // Si ya existe una entrada en el mapa para esta categoría, actualizamos el valor de 'ordinary'
      if (reportMap.has(category)) {
        let existingReport = reportMap.get(category);
        if (existingReport) {
          existingReport.ordinary = amount;
        }
      } else {
        // Si no existe, agregamos la categoría con valor 'ordinary' y 'extraordinary' inicializados en 0
        reportMap.set(category, {
          label: category,
          ordinary: amount,
          extraordinary: 0, // Inicializamos en 0
        });
      }
    });

    // Procesar la listado 'extraordinary'
    this.extraordinary.map((extr) => {
      let category = extr.category;
      let amount = this.getValueByType(extr.data); // Usamos la función que determina el valor según el tipo

      // Si ya existe una entrada en el mapa para esta categoría, actualizamos el valor de 'extraordinary'
      if (reportMap.has(category)) {
        let existingReport = reportMap.get(category);
        if (existingReport) {
          existingReport.extraordinary = amount;
        }
      } else {
        // Si no existe, agregamos la categoría con valor 'ordinary' en 0 y 'extraordinary' con el valor correspondiente
        reportMap.set(category, {
          label: category,
          ordinary: 0, // Inicializamos en 0
          extraordinary: amount,
        });
      }
    });

    // Construcción de los datos para el gráfico
    this.chartData = {
      labels: Array.from(reportMap.values()).map(report => report.label),
      datasets: [
        {
          label: 'Ordinarias',
          datalabels: {
            labels: {
              title: null
            }
          },
          data: Array.from(reportMap.values()).map(report => report.ordinary),

          backgroundColor: 'rgba(98, 182, 143, 1)',  // Color verde para Ordinarias

        },
        {
          label: 'Extraordinarias',
          datalabels: {
            labels: {
              title: null
            }
          },
          data: Array.from(reportMap.values()).map(report => report.extraordinary),
          backgroundColor: 'rgba(255, 145, 158, 1)',  // Color rojo para Extraordinarias

        },
      ]
    };
  }

  // Función para obtener el valor según el tipo
  getValueByType(data: DataDetails): number {
    switch (this.type) {
      case "Monto": return data.totalAmount/1000000;
      case "Promedio": return data.average/1000000;
      case "Porcentaje": return data.percentage;
      default: return 0;
    }
  }
}

interface Report {
  label: string;
  ordinary: number;
  extraordinary: number;
}
