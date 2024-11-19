import {
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  CommonModule,
  DatePipe,
  DecimalPipe,
  CurrencyPipe,
} from '@angular/common';
import {
  ChartData,
  ChartOptions,

} from 'chart.js';

import { NgPipesModule } from 'ngx-pipes';
import { Chart, registerables } from 'chart.js';
import {

  MainContainerComponent,
  ToastService,
  TableFiltersComponent,
  Filter,
  FilterOption,
  RadioFilter,
} from 'ngx-dabd-grupo01';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Expense from '../../../models/expense';
import { ReportPeriodService } from '../../../services/report-period/report-period.service';
import { ReportPeriod } from '../../../models/report-period/report-period';
import Period from '../../../models/period';
import { PeriodService } from '../../../services/period.service';
import { CategoryData } from '../../../models/report-period/category-data';
import { SupplierAmount } from '../../../models/report-period/SupplierAmount';
import * as XLSX from 'xlsx';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ExpensesPeriodsGraphicBarComponent } from './expenses-periods-graphic-bar/expenses-periods-graphic-bar.component';
import { ExpensesCategoryGraphicComponent } from './expenses-category-graphic/expenses-category-graphic.component';
@Component({
  selector: 'app-expenses-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NgPipesModule,
    MainContainerComponent,
    TableFiltersComponent,
    NgSelectComponent,
    ExpensesPeriodsGraphicBarComponent,
    ExpensesCategoryGraphicComponent  ],
  providers: [DatePipe, NgbActiveModal, CurrencyPipe, DecimalPipe],
  templateUrl: './expenses-period-report.component.html',
  styleUrl: './expenses-period-report.component.css',
})
export class ExpensesPeriodReportComponent implements OnInit {
  private reportPeriodService = inject(ReportPeriodService);
  private periodService = inject(PeriodService);
  private toastService = inject(ToastService);
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
    { nombre: 'Diciembre', numero: 12 }
  ];
  form = new FormGroup({
    mes: new FormControl(),
    anio: new FormControl()
  });
    reportPeriod: ReportPeriod | undefined;
  periodos: Period[] = [];
  filters: Filter[] = [];


  ordinaryData: { category: string; percentage: number }[] = [];
  extraordinaryData: { category: string; percentage: number }[] = [];

  periodsFilter: FilterOption[] = [];
  lotss: FilterOption[] = [];
  types: FilterOption[] = [];
  
  periodsList: Period[] = [];
  filterConfig: Filter[] = [];

  listPeriodFind: Period[] = [];
  expenses: Expense[] = [];
  searchTerm: string = '';
  chartInstances: any[] = [];
  resumeReportOrdinary: any;
  resumeReportExtraordinary: any;
  typeFilter:  "Monto" | "Promedio" | "Porcentaje" = "Monto"
  typeGraphic:  "General" | "Proveedores" | "Categorias" = "General"

  valueKPI1: number = 0;
  valueKPI2: number = 0;
  valueKPI3: number = 0;

  constructor() {
    Chart.register(...registerables); 
  }

  ngOnInit(): void {
    this.loadPeriodsList();
    this.form.valueChanges.subscribe(values => {
      if(values.anio!=null && values.mes != null){
        const period = this.periodsList.find((p)=>p.month===Number(values.mes) && p.year===Number(values.anio))
        if(period){
          if(this.listPeriodFind.some((p)=>p.id===period.id)){
            this.toastService.sendError("Ya selecciono este periodo")
          } else{
            if(this.listPeriodFind.length>5){
              this.toastService.sendError("Alcanzo el limite de periodos")
              return
            }
            const monthName = this.meses.find(m=>m.numero ===period.month)
            if(monthName){
              period.monthName = monthName?.nombre?.slice(0, 3) || "";
            }
            this.listPeriodFind.push(period)
          }
        }
        this.form.reset()
        this.loadReportPeriod(this.listPeriodFind.map(p=>p.id))
      }
    });
  }
  
  loadPeriodsList() {
    this.periodService.get().subscribe((data) => {
      this.periodsList = data;
      this.periodsList.forEach((p, index) => {
        if (index < 3) {
          const monthName = this.meses.find(m=>m.numero ===p.month)
          if(monthName){
            p.monthName = monthName?.nombre?.slice(0, 3) || "";

          }
          this.listPeriodFind.push(p)
       
        }
      });
      this.loadReportPeriod(
        this.listPeriodFind.map((p) => Number(p.id))
      );
      this.createFilter();
    });
  }

  loadReportPeriod(ids: number[]) {
    if (!ids || ids.length === 0) {
      this.toastService.sendError('No hay periodos seleccionados');
      return; 
    }
    this.valueKPI1=0
    this.valueKPI2=0
    this.valueKPI3=0

    this.reportPeriodService.getReportPeriods(ids).subscribe({
      next: (data) => {

        this.reportPeriod = this.keysToCamel(data) as ReportPeriod;;
        this.calculateKPI(this.reportPeriod);
        this.loadResume()
      },
      error: (error) => {
        this.toastService.sendError('Error al cargar el reporte');
      },
    });
  }

  createFilter() {
    this.filterConfig = [
      new RadioFilter('Monto total', 'typeFilter', [
        { value: 'Monto', label: 'Monto total' },
        { value: 'Porcentaje', label: 'Porcentaje' },
        { value: 'Promedio', label: 'Promedio' },
      ]),
      new RadioFilter('Grafico','typeGraphic',[
        {value:"General", label:"General"},
        {value:"Proveedores",label:"Proveedores"},
        {value:"Categorias", label:"categorias"}
      ])
    ];
  }

  filterChange($event: Record<string, any>) {
    const { typeFilter,typeGraphic } = $event;
    if (typeFilter) {
      this.typeFilter = typeFilter;
    }
    if(typeGraphic){
      this.typeGraphic=typeGraphic
    }
    this.loadReportPeriod(this.listPeriodFind.map((p) => Number(p.id)));
  }
  deletePeriod(index: number) {
    const periodToDelete = this.listPeriodFind[index];
    this.listPeriodFind.splice(index, 1);
    this.createFilter(); 
    if (this.listPeriodFind.length === 0) {
      (this.valueKPI1 = 0), (this.valueKPI3 = 0), (this.valueKPI2 = 0);
      this.reportPeriod = this.reportPeriod = {
        expenditures: {
          ordinary: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          },
          extraordinary: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          },
          total: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          }
        },
        categories: {
          ordinary: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          },
          extraordinary: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          },
          total: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          }
        },
        suppliers: {
          ordinary: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          },
          extraordinary: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          },
          total: {
            totalAmount: 0,
            percentage: 0,
            average: 0
          }
        },
        resume: {
          period: {
            month: 0,
            year: 0,
            state: '',
            id: 0,
            startDate: new Date(),
            endDate: new Date()
          },
          ordinary: [], 
          extraordinary: [],
          supplierOrdinary: [],
          supplierExtraordinary: []
        },
        periods: []
      }

      return;
    }
    this.loadReportPeriod(this.listPeriodFind.map((p) => Number(p.id)));
  }

  calculateKPI(resume: ReportPeriod): void {
    this.valueKPI1 =0;
    this.valueKPI2 =0;
    this.valueKPI3 = 0;
    if(!resume){
      return
    }
    if(this.typeGraphic==="General"){
      switch (this.typeFilter) {
        case 'Monto': {
          this.valueKPI1 = Number((resume.expenditures.ordinary.totalAmount / 1000000).toFixed(3));
          this.valueKPI2 = Number((resume.expenditures.extraordinary.totalAmount / 1000000).toFixed(3));
          this.valueKPI3 = Number((resume.expenditures.total.totalAmount / 1000000).toFixed(3));
          break;
  
        }
        case 'Porcentaje': {
          this.valueKPI1 = resume.expenditures.ordinary.percentage;
          this.valueKPI2 = resume.expenditures.extraordinary.percentage;
          this.valueKPI3 = resume.expenditures.total.percentage;
          break;
        }
        case "Promedio": {
          this.valueKPI1 = Number((resume.expenditures.ordinary.average / 1000000).toFixed(3));
          this.valueKPI2 = Number((resume.expenditures.extraordinary.average / 1000000).toFixed(3));
          this.valueKPI3 = Number((resume.expenditures.total.average / 1000000).toFixed(3));
          break;
        }
        default:
          return;
      }
    }
    if(this.typeGraphic==="Categorias"){
      switch (this.typeFilter) {
        case 'Monto': {
          this.valueKPI1 = Number((resume.categories.ordinary.totalAmount / 1000000).toFixed(3));
          this.valueKPI2 = Number((resume.categories.extraordinary.totalAmount / 1000000).toFixed(3));
          this.valueKPI3 = Number((resume.categories.total.totalAmount / 1000000).toFixed(3));
          break;
  
        }
        case 'Porcentaje': {
          this.valueKPI1 = resume.categories.ordinary.percentage;
          this.valueKPI2 = resume.categories.extraordinary.percentage;
          this.valueKPI3 = resume.categories.total.percentage;
          break;
        }
        case "Promedio": {
          this.valueKPI1 = Number((resume.categories.ordinary.average / 1000000).toFixed(3));
          this.valueKPI2 = Number((resume.categories.extraordinary.average / 1000000).toFixed(3));
          this.valueKPI3 = Number((resume.categories.total.average / 1000000).toFixed(3));
          break;
        }
        default:
          return;
      }
      
    }
    if(this.typeGraphic==="Proveedores"){
      switch (this.typeFilter) {
        case 'Monto': {
          this.valueKPI1 = Number((resume.suppliers.ordinary.totalAmount / 1000000).toFixed(3));
          this.valueKPI2 = Number((resume.suppliers.extraordinary.totalAmount / 1000000).toFixed(3));
          this.valueKPI3 = Number((resume.suppliers.total.totalAmount / 1000000).toFixed(3));
          
          break;
        }
        case 'Porcentaje': {
          this.valueKPI1 = resume.suppliers.ordinary.percentage;
          this.valueKPI2 = resume.suppliers.extraordinary.percentage;
          this.valueKPI3 = resume.suppliers.total.percentage;
          
          break;
        }
        case "Promedio": {
          this.valueKPI1 = Number((resume.categories.ordinary.average / 1000000).toFixed(3));
          this.valueKPI2 = Number((resume.categories.extraordinary.average / 1000000).toFixed(3));
          this.valueKPI3 = Number((resume.categories.total.average / 1000000).toFixed(3));
  
          break;
        }
        default:
          return;
      }
      
    }
  }
  loadResume() {
  
    this.createSuppliersChart(
      'supplier-ordinary',
      this.reportPeriod?.resume?.supplierOrdinary || [],
      'Top 5 proveedores ordinarios'
    );
    this.createSuppliersChart(
      'supplier-extraordinary',
      this.reportPeriod?.resume?.supplierExtraordinary || [],
      'Top 5 de proveedores extraordinarios'
    );
  }

  
  topSupplier: any;

  getTopOneSupplier() {
    const suppliers = this.reportPeriod?.resume.supplierOrdinary;

    if (suppliers && suppliers.length > 0) {
      this.topSupplier = suppliers.reduce((top, current) => {
        return current.totalAmount > top.totalAmount ? current : top;
      });
    } else {
      this.topSupplier = null;
    }
  }

  private router = inject(Router);

  navigateToTopSuppliers() {
    this.router.navigate(['/gastos/top-proveedores']);
  }

 
  createChartResume(
    chartId: string,
    ordinary: CategoryData[],
    extraordinary: CategoryData[],
    element: string
  ): any {
    let reportMap = new Map<string, Report>();

    ordinary.map((ord) => {
      let category = ord.category;
      let amount = 0;

      if (this.typeFilter == 'Porcentaje') {
        amount = ord.data.percentage;
      } else if (this.typeFilter == 'Promedio') {
        amount = ord.data.average;
      } else {
        amount = ord.data.totalAmount;
      }
      if (reportMap.has(category)) {
        let existingReport = reportMap.get(category);
        if (existingReport) {
          existingReport.ordinary = amount;
        }
      } else {
        reportMap.set(category, {
          label: category,
          ordinary: amount,
          extraordinary: 0,
        });
      }
    });

    extraordinary.map((extr) => {
      let category = extr.category;
      let amount = 0;

      if (this.typeFilter == 'Porcentaje') {
        amount = extr.data.percentage;
      } else if (this.typeFilter == 'Promedio') {
        amount = extr.data.average;
      } else {
        amount = extr.data.totalAmount;
      }

      if (reportMap.has(category)) {
        let existingReport = reportMap.get(category);
        if (existingReport) {
          existingReport.extraordinary = amount;
        }
      } else {
        reportMap.set(category, {
          label: category,
          ordinary: 0,
          extraordinary: amount,
        });
      }
    });
    let labels: string[] = [];
    let ordinaryValues: number[] = [];
    let extraordinaryValues: number[] = [];
    reportMap.forEach((value, key) => {
      labels = [...labels, key];
      ordinaryValues = [...ordinaryValues, value.ordinary / 1000000];
      extraordinaryValues = [
        ...extraordinaryValues,
        value.extraordinary / 1000000,
      ];
    });
    const chartData: ChartData<'radar'> = {
      labels: labels,
      datasets: [
        {
          label: 'Ordinarias ',
          data: ordinaryValues,
          datalabels: {
            labels: {
              title: null
            }
          },
          borderColor: 'rgba(13,110,253,1)',
          backgroundColor: 'rgba(13, 110, 253, 0.2)', 
          borderWidth: 1,
          pointBackgroundColor: 'rgba(13, 110, 253, 0.2)',
        },
        {
          label: 'Extraordinarias ', 
          datalabels: {
            labels: {
              title: null
            }
          },
          data: extraordinaryValues,
          borderColor: 'rgba(220, 53, 69, 1)',
          backgroundColor: 'rgba(220, 53, 69, 0.2)', 
          borderWidth: 1,
        },
      ],
    };
    const chartOptions: ChartOptions = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Comparación de Ordinarias y Extraordinarias',
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}`,
          },
        },
        legend: {
          onClick: (event, legendItem) => {
          
          },
        },
      },
    };

    try {
      let canvas;
      const parentElement = document.getElementById(element); 

      if (parentElement) {
        while (parentElement.firstChild) {
          parentElement.removeChild(parentElement.firstChild);
        }


        canvas = document.createElement('canvas');
        canvas.id = chartId; 
        canvas.height=75
        parentElement.appendChild(canvas); 
      }

      
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'bar', 
          data: chartData,
          options: chartOptions,
        });

        
        this.chartInstances.push(chart);
        return chart;
      }
    } catch (err) {
    }
  }

 
  createSuppliersChart(
    chartId: string,
    suppliers: SupplierAmount[],
    title: string
  ): any {
    
    suppliers = suppliers
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
    const labels = suppliers.map((item) => item.supplierDTO.name);
    const data = suppliers.map((item) =>{
      if(this.typeFilter==="Monto"){
       return Number((item.totalAmount / 1000000).toFixed(3))
      } else if(this.typeFilter==="Promedio"){
        return Number((item.average / 1000000).toFixed(3))
      } else if (this.typeFilter==="Porcentaje"){
        return item.percentage
      } else return 0
    }
    );
    const chartData: ChartData<'bar'> = {
      labels: labels,
      datasets: [
        {
          label: 'Monto total proveedores en millones',
          data: data,
          datalabels: {
            display: true,
            formatter: (value) => {
              if(this.typeFilter==="Porcentaje"){
                return `%${value}`
              } else{
                return `$${(value * 1000000).toLocaleString()}`;
              } 
            },
            labels: {
              title: {
                font: {
                  weight: 'bold',
                },
              },
            },
          },
          backgroundColor:
            chartId == 'supplier-ordinary'
              ? 'rgba(98, 182, 143, 1)'
              : 'rgba(255, 145, 158, 1)', 
          borderColor:
            chartId == 'supplier-ordinary'
              ? 'rgba(98, 182, 143, 1)'
              : 'rgba(255, 145, 158, 1)',
          borderWidth: 1,
        },
      ],
    };

    const chartOptions: ChartOptions<'bar'> = {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: title,
        },
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.dataset.label}: $${tooltipItem.formattedValue}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    };

    try {
      let canvas;
      const parentElement = document.getElementById(chartId);

      if (parentElement) {
        
        while (parentElement.firstChild) {
          parentElement.removeChild(parentElement.firstChild);
        }

        
        canvas = document.createElement('canvas');
        canvas.id = chartId; 
        parentElement.appendChild(canvas); 
      }

      
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const ordinaryChart = new Chart(ctx, {
          type: 'bar',
          data: chartData,
          options: chartOptions,
        });

        
        this.chartInstances.push(ordinaryChart);
        return ordinaryChart; 
      }
    } catch (err) {
    }
  }

  exportToExcel() {
    const combinedData = this.reportPeriod?.periods.flatMap((period) => {
      const ordinaryData = period.ordinary.map((item) => ({
        Period: `${period.period.month}/${period.period.year}`,
        Category: item.category,
        Type: 'Ordinaria',
        Amount: item.data.totalAmount,
        Percentage: item.data.percentage / 100,
        Average: item.data.average,
      }));

      const extraordinaryData = period.extraordinary.map((item) => ({
        Period: `${period.period.month}/${period.period.year}`,
        Category: item.category,
        Type: 'Extraordinaria',
        Amount: item.data.totalAmount,
        Percentage: item.data.percentage / 100,
        Average: item.data.average,
      }));

      return [...ordinaryData, ...extraordinaryData];
    });

    const data = combinedData?.map((period) => ({
      Periodo: period.Period,
      Categoría: period.Category,
      'Tipo de gasto': period.Type,
      'Monto Total': period.Amount,
      Porcentaje: period.Percentage,
      Promedio: period.Average,
    }));

    if (!data) {
      this.toastService.sendError('No hay datos para exportar');
      return;
    }
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const col = XLSX.utils.encode_col(C);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cell = ws[`${col}${R + 1}`];
        if (cell) {
          if (col === 'D' || col === 'F') {
            cell.z = '$0.00';
          } else if (col === 'E') {
            cell.z = '0.00%';
          }
        }
      }
    }

    
    ws['!cols'] = [
      { wch: 15 }, // Periodo
      { wch: 30 }, // Categoría
      { wch: 15 }, // Tipo de gasto
      { wch: 15 }, // Monto Total
      { wch: 10 }, // Porcentaje
      { wch: 15 }, // Promedio
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, `Expenses_report:${new Date().getTime()}.xlsx`);
  }

  toCamel(s: string) {
    return s.replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '');
    });
  }

  keysToCamel(o: any): any {
    if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
      const n: {[key: string]: any} = {};       Object.keys(o).forEach((k) => {
        n[this.toCamel(k)] = this.keysToCamel(o[k]);
      });       return n;
    } else if (Array.isArray(o)) {
      return o.map((i) => {         return this.keysToCamel(i);       });
    }     return o;
  }
}
interface Report {
  label: string;
  ordinary: number;
  extraordinary: number;
}
