import { Component, inject } from '@angular/core';
import { ExpenseServiceService } from '../../../../services/expense.service';
import { RouterModule } from '@angular/router';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { PeriodSelectComponent } from '../../../selects/period-select/period-select.component';
import { CommonModule, DatePipe } from '@angular/common';
import { NgPipesModule } from 'ngx-pipes';

import {
  Filter,
  FilterOption,
  MainContainerComponent,
  NumberFilter,
  SelectFilter,
  TableComponent,
  TableFiltersComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import Chart from 'chart.js/auto';
import { BillService } from '../../../../services/bill.service';
import { PeriodService } from '../../../../services/period.service';

import * as XLSX from 'xlsx';
import { InfoExpenseReportComponent } from '../../../modals/info-expense-report/info-expense-report.component';
import Period from '../../../../models/period';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
Chart.register(ChartDataLabels);
@Component({
  selector: 'app-expenses-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PeriodSelectComponent,
    TableComponent,
    NgPipesModule,
    MainContainerComponent,
    TableFiltersComponent,
    BaseChartDirective,
    ReactiveFormsModule,
  ],
  providers: [DatePipe, NgbActiveModal],
  templateUrl: './expenses-report.component.html',
  styleUrl: './expenses-report.component.css',
})
export class ExpensesReportComponent {
  
  private readonly periodService = inject(PeriodService);
  total: number | undefined;
  averageAmount: number | undefined;
  totalLotes: number | undefined;
  typesPlots: number | undefined;
  top: boolean = true;
  totalAmountPerTypePlot: Map<String, number>[] | undefined;

  modalService = inject(NgbModal);
  menosMayor: number = 1;
  periods: Period[] = [];
  categories: FilterOption[] = [];
  types: FilterOption[] = [];
  filterConfig: Filter[] = [
    new SelectFilter(
      'Tipo de Top',
      'lot',
      'Seleccione un tipo de top',
      this.categories
    ),
    new NumberFilter(
      'Cantidad de lotes para mostrar',
      'count',
      'Seleccione una cantidad'
    ),
  ];
  selectedPeriodId: number = 0;
  countPlots: number = 10; //Predefinido 10

  public pieChartPlugins: any = [ChartDataLabels];
  ngOnInit(): void {
    this.loadSelect();
    this.loadExpenseData();
    this.loadKpis();
    this.form.valueChanges.subscribe((values) => {
      if (values.anio != null && values.mes != null) {
        const period = this.periods.find(
          (p) =>
            p.month === Number(values.mes) && p.year === Number(values.anio)
        );
        if (period) {
          this.selectedPeriodId = period.id;
        } else {
          this.toast.sendError('No existe ese periodo');
        }
        
        this.loadExpenseData();
        this.loadKpis();
      }
    });
  }
  form = new FormGroup({
    mes: new FormControl(),
    anio: new FormControl(),
  });
  meses = [
    { nombre: 'Enero', numero: 1 },
    { nombre: 'Febrero', numero: 2 },
    { nombre: 'Marzo', numero: 3 },
    { nombre: 'Abril', numero: 4 },
    { nombre: 'Mayo', numero: 5 },
    { nombre: 'Junio', numero: 6 },
    { nombre: 'Julio', numero: 7 },
    { nombre: 'Agosto', numero: 8 },
    { nombre: 'Septiembre', numero: 9 },
    { nombre: 'Octubre', numero: 10 },
    { nombre: 'Noviembre', numero: 11 },
    { nombre: 'Diciembre', numero: 12 },
  ];
  getMonthName(month: number): string {
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    return monthNames[month - 1];
  }
  loadSelect() {
    
    this.periodService.get().subscribe((data: Period[]) => {
      this.periods = data;
      this.selectedPeriodId=data[data.length-1].id
    });
    
    this.categories.push({ value: "1", label: 'Lotes que mas pagaron' });
    
    this.categories.push({ value: "2", label: 'Lotes que menos pagaron' });
  }

  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartOptions = {
    responsive: true,
    indexAxis: 'x',
    plugins: {
      title: {
        display: true,
        text: 'Distribución de Expensas por Lote (en millones)',
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: {
            size: 14,
          },
        },
      },
    },
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Expensas Totales por Lote',

        backgroundColor: [
          'rgba(98, 182, 143, 1)', // Verde pastel
          'rgba(255, 145, 158, 1)', // Rojo pastel
          'rgba(130, 177, 255, 1)', // Azul pastel
        ],
        borderWidth: 1,
      },
    ],
  };

  public kpiChartLote: ChartType = 'pie';
  public kpiChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Distribución de Expensas por Tipo de Lote (en millones)',
      },
    },
  };
  public kpiChartLotData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],

        backgroundColor: [
          'rgba(98, 182, 143, 1)', // Verde pastel
          'rgba(255, 145, 158, 1)', // Rojo pastel
          'rgba(130, 177, 255, 1)', // Azul pastel
          'rgba(187, 131, 209, 1)', // Púrpura pastel
          'rgba(255, 171, 145, 1)', // Naranja pastel
          'rgba(162, 217, 165, 1)', // Verde claro pastel
          'rgba(149, 160, 217, 1)', // Azul índigo pastel
          'rgba(255, 162, 154, 1)', // Rojo claro pastel
          'rgba(126, 206, 198, 1)', // Turquesa pastel
          'rgba(255, 245, 157, 1)', // Amarillo claro pastel
          'rgba(255, 224, 130, 1)', // Amarillo pastel
          'rgba(220, 231, 117, 1)', // Lima pastel
          'rgba(196, 196, 196, 1)', // Gris pastel
          'rgba(188, 170, 164, 1)', // Café pastel
          'rgba(144, 202, 249, 1)', // Azul claro past
        ],
        borderWidth: 1,
      },
    ],
  };
  public kpiChart1Tpe: ChartType = 'bar';
  public kpiChart1Options: ChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Distribución de Expensas por periodo (en millones)',
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: {
            size: 14,
          },
        },
      },
    },
  };
  public kpiChart1Data: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(98, 182, 143, 1)', // Verde pastel
          'rgba(255, 145, 158, 1)', // Rojo pastel
          'rgba(130, 177, 255, 1)', // Azul pastel
          'rgba(187, 131, 209, 1)', // Púrpura pastel
          'rgba(255, 171, 145, 1)', // Naranja pastel
          'rgba(162, 217, 165, 1)', // Verde claro pastel
          'rgba(149, 160, 217, 1)', // Azul índigo pastel
          'rgba(255, 162, 154, 1)', // Rojo claro pastel
          'rgba(126, 206, 198, 1)', // Turquesa pastel
          'rgba(255, 245, 157, 1)', // Amarillo claro pastel
          'rgba(255, 224, 130, 1)', // Amarillo pastel
          'rgba(220, 231, 117, 1)', // Lima pastel
          'rgba(196, 196, 196, 1)', // Gris pastel
          'rgba(188, 170, 164, 1)', // Café pastel
          'rgba(144, 202, 249, 1)', // Azul claro past
        ],
        borderWidth: 1,
      },
    ],
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(98, 182, 143, 1)', // Verde pastel
          'rgba(255, 145, 158, 1)', // Rojo pastel
          'rgba(130, 177, 255, 1)', // Azul pastel
        ],
        borderWidth: 1,
      },
    ],
  };

  service: ExpenseServiceService = inject(ExpenseServiceService);
  titulo: string = 'más pagaron';
  periodo: string = '';
  cantidad: number = 10;
  private toast = inject(ToastService);

  loadKpis() {
    this.service
      .getExpensesByLot(this.top, this.selectedPeriodId, this.countPlots)
      .subscribe((expenses) => {
        if (this.countPlots == 0) {
          this.cantidad = 10;
          this.countPlots = 10;
        }
        if (this.top == null) {
          this.top = true;
        }
        this.total = Number((expenses.totalAmount / 1000000).toFixed(3));
        this.averageAmount = Number(
          (expenses.averageAmount / 1000000).toFixed(3)
        );
        this.totalLotes = expenses.totalPlots;
        this.typesPlots = expenses.typesPlots;
      });
  }
  

  loadExpenseData(): void {
    if (this.countPlots == 0) {
      this.cantidad = 10;
      this.countPlots = 10;
    }
    if (this.countPlots > 15) {
      this.cantidad = 10;
      this.countPlots = 10;
    }
    if (this.top == null) {
      this.top = true;
    }
    
    this.service
      .getExpensesByLot(this.top, this.selectedPeriodId, this.countPlots)
      .subscribe((expenseReport) => {
        const lotNumbers = expenseReport.expenses
          .map((expenseReport) => expenseReport.plotNumber)
          .reverse();
        const totalAmounts = expenseReport.expenses.map((expenseReport) =>
          Number((expenseReport.totalAmount / 1000000).toFixed(3))
        );
        
        const valuesArray: number[] = Object.values(
          expenseReport.totalAmountPerTypePlot
        )
          .map((num) => (num = Number(num / 100000)))
          .reverse();
        const labelsArray: string[] = Object.keys(
          expenseReport.totalAmountPerTypePlot
        ).reverse();
        const valuesArrayLine: number[] = Object.values(
          expenseReport.totalAmountPerPeriod
        )
          .map((num) => Number(num / 100000))
          .reverse();
        
        const labelsArrayLine: string[] = Object.keys(
          expenseReport.totalAmountPerPeriod
        ).reverse();

        
        this.kpiChart1Data = {
          labels: labelsArrayLine,
          datasets: [
            {
              data: valuesArrayLine,
              label: 'Total del Periodo',
              datalabels: {
                labels: {
                  title: null,
                },
              },
              backgroundColor: [
                'rgba(98, 182, 143, 1)', // Verde pastel
                'rgba(255, 145, 158, 1)', // Rojo pastel
                'rgba(130, 177, 255, 1)', // Azul pastel
                'rgba(187, 131, 209, 1)', // Púrpura pastel
                'rgba(255, 171, 145, 1)', // Naranja pastel
                'rgba(162, 217, 165, 1)', // Verde claro pastel
                'rgba(149, 160, 217, 1)', // Azul índigo pastel
                'rgba(255, 162, 154, 1)', // Rojo claro pastel
                'rgba(126, 206, 198, 1)', // Turquesa pastel
                'rgba(255, 245, 157, 1)', // Amarillo claro pastel
                'rgba(255, 224, 130, 1)', // Amarillo pastel
                'rgba(220, 231, 117, 1)', // Lima pastel
                'rgba(196, 196, 196, 1)', // Gris pastel
                'rgba(188, 170, 164, 1)', // Café pastel
                'rgba(144, 202, 249, 1)', // Azul claro past
              ],
              borderWidth: 1,
            },
          ],
        };
        (this.kpiChartLotData = {
          labels: labelsArray,
          datasets: [
            {
              data: valuesArray,
              backgroundColor: [
                'rgba(98, 182, 143, 1)', // Verde pastel
                'rgba(255, 145, 158, 1)', // Rojo pastel
                'rgba(130, 177, 255, 1)', // Azul pastel
                'rgba(187, 131, 209, 1)', // Púrpura pastel
                'rgba(255, 171, 145, 1)', // Naranja pastel
                'rgba(162, 217, 165, 1)', // Verde claro pastel
                'rgba(149, 160, 217, 1)', // Azul índigo pastel
                'rgba(255, 162, 154, 1)', // Rojo claro pastel
                'rgba(126, 206, 198, 1)', // Turquesa pastel
                'rgba(255, 245, 157, 1)', // Amarillo claro pastel
                'rgba(255, 224, 130, 1)', // Amarillo pastel
                'rgba(220, 231, 117, 1)', // Lima pastel
                'rgba(196, 196, 196, 1)', // Gris pastel
                'rgba(188, 170, 164, 1)', // Café pastel
                'rgba(144, 202, 249, 1)', // Azul claro past
              ],
              borderWidth: 1,
            },
          ],
        }),
          (this.kpiChartOptions = {
            responsive: true,
            plugins: {
              datalabels: {
                formatter: (value) => {
                  const total = valuesArray.reduce(
                    (acc, curr) => acc + curr,
                    0
                  );
                  const percentage = ((value / total) * 100).toFixed(2) + '%';
                  return percentage;
                },
                labels: {
                  title: {
                    font: {
                      weight: 'bold',
                    },
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          } as ChartOptions);
        this.barChartData = {
          labels: lotNumbers,
          datasets: [
            {
              data: totalAmounts,
              label: 'Monto del Lote',
              datalabels: {
                labels: {
                  title: null,
                },
              },
              backgroundColor: [
                'rgba(98, 182, 143, 1)', // Verde pastel
                'rgba(255, 145, 158, 1)', // Rojo pastel
                'rgba(130, 177, 255, 1)', // Azul pastel
                'rgba(187, 131, 209, 1)', // Púrpura pastel
                'rgba(255, 171, 145, 1)', // Naranja pastel
                'rgba(162, 217, 165, 1)', // Verde claro pastel
                'rgba(149, 160, 217, 1)', // Azul índigo pastel
                'rgba(255, 162, 154, 1)', // Rojo claro pastel
                'rgba(126, 206, 198, 1)', // Turquesa pastel
                'rgba(255, 245, 157, 1)', // Amarillo claro pastel
                'rgba(255, 224, 130, 1)', // Amarillo pastel
                'rgba(220, 231, 117, 1)', // Lima pastel
                'rgba(196, 196, 196, 1)', // Gris pastel
                'rgba(188, 170, 164, 1)', // Café pastel
                'rgba(144, 202, 249, 1)', // Azul claro past
              ],
              borderWidth: 1,
            },
          ],
        };
      });
  }

  
  showInfo() {
    this.modalService.open(InfoExpenseReportComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });
  }

  downloadTable() {
    this.service
      .getExpensesByLot(true, this.selectedPeriodId, this.countPlots)
      .subscribe((expenses) => {
        const data = expenses.expenses.map((expense) => ({
          Periodo: `${expense?.period?.month} / ${expense?.period?.year}`,
          'Monto Total': expense.totalAmount,
          'Numero de lote': expense.plotNumber,
        }));
        const today = new Date();
        const formattedDate = today.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
        XLSX.writeFile(wb, 'Top de montos Fecha: ' + formattedDate + '.xlsx');
      });
  }
  filterChange($event: Record<string, any>) {
    this.selectedPeriodId = $event['period'] || null;
    this.countPlots = $event['count'];
    this.cantidad = this.countPlots;
    this.menosMayor = $event['lot'] || null;
    if (this.menosMayor == 1) {
      this.top = true;
      this.titulo = 'más pagaron';
    } else {
      this.top = false;
      this.titulo = 'menos pagaron';
    }
    if (Number($event['count']) < 1) {
      this.toast.sendError('El minimo de lotes es 1');
      this.countPlots = 1;
      return;
    }
    if (Number($event['count']) > 15) {
      this.toast.sendError('El máximo de lotes es 15');
      this.countPlots = 15;
      return;
    }
    this.loadExpenseData();
    this.loadKpis();
  }

  onPeriodChange($event: Event): void {
    const selectedIndex = ($event.target as HTMLSelectElement).value;
    this.selectedPeriodId = Number(selectedIndex); 
    this.loadExpenseData();
    this.loadKpis();
  }
}
