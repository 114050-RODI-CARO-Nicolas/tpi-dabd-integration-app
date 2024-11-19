import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
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
  ChartConfiguration,
  Chart,
} from 'chart.js';
import { DatePipe } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryData } from '../../../../models/report-period/category-data';
import { DataDetails } from '../../../../models/report-period/data-details';
import { Resume } from '../../../../models/report-period/resume';
Chart.register(
  BarController,
  PieController,
  RadarController,
  LineController,
  PolarAreaController,
  DoughnutController,
  BubbleController,
  ScatterController
);

@Component({
  selector: 'app-expenses-category-graphic',
  standalone: true,
  imports: [NgPipesModule, BaseChartDirective],
  providers: [DatePipe, NgbActiveModal],
  templateUrl: './expenses-category-graphic.component.html',
  styleUrl: './expenses-category-graphic.component.css',
})
export class ExpensesCategoryGraphicComponent {
  @Input() periods: Resume[] = []; 
  @Input() typeFilter: string = 'Promedio'; 
  @Input() type:"Ordinary"|"Extraordinary"="Ordinary"
 
  chartDataOrdinary: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };
  chartDataExtraordinary: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };
  chartType: ChartType = 'bar'; 
  chartOptions: ChartOptions = {
    responsive: true,
    indexAxis: 'y', 
    plugins: {
      title: {
        display: true,
        text: 'Gráfico de Periodos',
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue}`;
          },
        },
      },
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['periods']) {
      this.updateChartData();
    }
  }

  private updateChartData() {
    const labelsOrdinary = this.periods[0]?.ordinary.map((item) => item.category) || [];
    const labelsExtraordinary = this.periods[0]?.extraordinary.map((item) => item.category) || []
    const getColor = (index: number) => {
      const colors = [
   'rgba(98, 182, 143, 1)',     // Verde pastel
'rgba(255, 145, 158, 1)',    // Rojo pastel
'rgba(130, 177, 255, 1)',    // Azul pastel
'rgba(187, 131, 209, 1)',    // Púrpura pastel
'rgba(255, 171, 145, 1)',    // Naranja pastel
'rgba(162, 217, 165, 1)',    // Verde claro pastel
'rgba(149, 160, 217, 1)',    // Azul índigo pastel
'rgba(255, 162, 154, 1)',    // Rojo claro pastel
'rgba(126, 206, 198, 1)',    // Turquesa pastel
'rgba(255, 245, 157, 1)',    // Amarillo claro pastel
'rgba(255, 224, 130, 1)',    // Amarillo pastel
'rgba(220, 231, 117, 1)',    // Lima pastel
'rgba(196, 196, 196, 1)',    // Gris pastel
'rgba(188, 170, 164, 1)',    // Café pastel
'rgba(144, 202, 249, 1)'     // Azul claro past
      ];
      return {
        datalabels: {
          labels: {
            title: null
          }
        },
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 1,
      };
    };

    
    const prepareChartData = (
      categoryData: CategoryData[],
      labelPrefix: string,
      isExtraordinary: boolean
    ) => {
      
      return this.periods.map((periodData, index) => {
        let data: number[] = [];
        const dataField = isExtraordinary
          ? periodData.extraordinary
          : periodData.ordinary;

        if (this.typeFilter === 'Porcentaje') {
          data = dataField.map((item) => item.data.percentage);
        } else if (this.typeFilter === 'Promedio') {
          data = dataField.map((item) => item.data.average / 1000000);
        } else {
          data = dataField.map((item) => item.data.totalAmount / 1000000);
        }

        return {
          label: `${labelPrefix} ${periodData.period.month}/${periodData.period.year}`,
          data: data,
          ...getColor(index),
        };
      });
    };

    
    const ordinaryData = prepareChartData(
      this.periods[0]?.ordinary || [],
      'Ordinarias',
      false
    );
    
    const extraordinaryData = prepareChartData(
      this.periods[0]?.extraordinary || [],
      'Extraordinarias',
      true
    );

    
    this.chartDataOrdinary = {
      labels: labelsOrdinary,
      datasets: ordinaryData,
    };

    
    this.chartDataExtraordinary = {
      labels: labelsExtraordinary,
      datasets: extraordinaryData,
    };
  }
}
