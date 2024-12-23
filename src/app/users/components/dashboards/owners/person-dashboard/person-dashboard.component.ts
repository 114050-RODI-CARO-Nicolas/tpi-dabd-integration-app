import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, output} from '@angular/core';
import {OwnerDashboardFilter, GraphModel, KpiModel} from "../../../../models/dashboard.model";
import {KpiComponent} from "../../commons/kpi/kpi.component";
import {BarchartComponent} from "../../commons/barchart/barchart.component";
import {PiechartComponent} from "../../commons/piechart/piechart.component";
import {ChartType} from "angular-google-charts";
import {OwnerService} from '../../../../services/owner.service';
import {Owner, StateKYC} from '../../../../models/owner';
import {toCamelCase} from '../../../../utils/owner-helper';


@Component({
  selector: 'app-person-dashboard',
  standalone: true,
    imports: [
        KpiComponent,
        PiechartComponent
    ],
  templateUrl: './person-dashboard.component.html',
  styleUrl: './person-dashboard.component.scss'
})
export class PersonDashboardComponent {
//inputs
  @Input() service!: OwnerService;
  @Input() filters: OwnerDashboardFilter = {} as OwnerDashboardFilter;
  @Output() notifyParent: EventEmitter<string> = new EventEmitter<string>();

  //vars
  kpi1: KpiModel = {} as KpiModel
  kpi2: KpiModel = {} as KpiModel
  kpi3: KpiModel = {} as KpiModel
  kpi4: KpiModel = {} as KpiModel

  graph1: GraphModel = {} as GraphModel
  graph2: GraphModel = {} as GraphModel
  graph3: GraphModel = {} as GraphModel
  graph4: GraphModel = {} as GraphModel


  //redirect
  sendNotification(mode: string) {
    this.notifyParent.emit(mode);
  }
  //init
  constructor() {
    this.kpi1 = {title: "Nuevos en Último Año", desc: "", value: "0", icon: "bi bi-check-circle", color: "bg-success"}
    this.kpi2 = {title: "Propietarios Activos", desc: "Diferencias porcentuales respecto al periodo anterior", value: "0%", icon: "bi bi-graph-up", color: "bg-info"}
    this.kpi3 = {title: "Tipo de Ingreso/Egreso Más Frecuente", desc: "Tipo más frecuente en el periodo", value: "0", icon: "bi bi-person-circle", color: "bg-warning"}
    this.kpi4 = {title: "Total de Ingresos/Egresos Inconsistentes", desc: "Cantidad total de inconsistencias en el periodo", value: "0", icon: "bi-exclamation-circle", color: "bg-danger"}

    this.graph1 = {title: "Totales de Ingresos/Egresos por Periodo", subtitle: "", data: [], options: null}
    this.graph2 = {title: "Empleados con Egreso Tardío", subtitle: "", data: [], options: null}
    this.graph3 = {title: "Distribución de Tipos de Ingresos/Egresos", subtitle: "Porcentaje de cada tipo en el periodo", data: [], options: null}
    this.graph4 = {title: "Inconsistencias en Ingresos/Egresos", subtitle: "Ingresos/egresos con inconsistencias en el periodo", data: [], options: null}
  }

  //getData
  getData() {
    console.log(this.filters)

    this.kpi1.title = "Nuevos en Último Año"

    this.kpi2.title = "Propietarios Activos"

    this.kpi3.title = "Tipo mas Recurrente"

    this.kpi4.title = "Propietarios sin Validar"

    this.graph1.title = "Distribución de estado KYC"

    this.graph2.title = "Propietarios Activos e Inactivos"

    // this.graph4.options = {...this.columnChartOptions,
    //   colors: ['#ffc107']}
    // this.graph4.options.chartArea.width='95%';
    // this.graph4.options.width = 900;
    // this.graph4.options.height = 175;

    // this.graph3.options = this.pieChartOptions

    this.graph2.options = {...this.columnChartOptions,
      colors: ['#ffc107']}
    this.graph2.options.width = null;
    this.graph2.options.height = 200;

    //obtener filtro

    this.service.dinamicFilters(0, 2147483647, toCamelCase(this.filters)).subscribe({
      next: data => {

        this.graph1.data = this.mapKycStatusData(data.content);
        this.graph1.options = { ...this.columnChartOptions, colors: ['#3498db', '#2ecc71', '#e74c3c'] };
        this.graph1.options.height = 500;

        this.graph2.data = this.mapIsActiveData(data.content);
        this.graph2.options = { ...this.columnChartOptions, colors: ['#2ecc71', '#e74c3c'] };
        this.graph2.options.height = 500;

      },
      error: (err) => {
        console.error('Error al obtener datos de KYC', err);
      }
    });
  }


  columnChartOptions = {
    backgroundColor: 'transparent',
    legend: {position: 'none'},
    chartArea: {width: '80%', height: '60%'},
    vAxis: {
      textStyle: {
        color: '#6c757d',
        fontSize: 12  // Tamaño de fuente más pequeño
      },
      // Formato personalizado para mostrar los valores en miles
      format: '#',
    },
    hAxis: {
      textStyle: {color: '#6c757d'},
      showTextEvery: 2,
    },
    animation: {
      duration: 1000,
      easing: 'out',
      startup: true
    },
    height: 400,
    width: '100%',
    bar: {groupWidth: '70%'}
  };

  pieChartOptions = {
    backgroundColor: 'transparent',
    legend: {
      position: 'right-center',
      textStyle: { color: '#6c757d', fontSize: 17 }
    },
    chartArea: { width: '100%', height: '100%' },
    pieHole: 0,
    height: '80%',
    slices: {
      0: { color: '#00BFFF' },  // MP siempre azul
      1: { color: '#8A2BE2' },  // STRIPE siempre violeta
      2: { color: '#ACE1AF' }   // EFECTIVO siempre verde
    },
    pieSliceTextStyle: {
      color: 'black',
      fontSize: 18
    }
  };

  ngAfterViewInit(): void {
    this.getData()
  }

  mapKycStatusData(array: any[]): any {
    const countKycStatus: { [key in StateKYC]: number } = {
      [StateKYC.TO_VALIDATE]: 0,
      [StateKYC.VALIDATED]: 0,
      [StateKYC.INITIATED]: 0,
      [StateKYC.CANCELED]: 0
    };

    array.forEach(data => {
      if (Object.values(StateKYC).includes(data.kycStatus as StateKYC)) {
        countKycStatus[data.kycStatus as StateKYC]++;
      }
    });

    // Devolvemos los datos en formato adecuado para el gráfico de torta
    return Object.entries(countKycStatus).map(([key, value]) => [
      key,
      value
    ]);
  }

  mapIsActiveData(array: any[]): any {
    const countIsActive: { [key: string]: number } = {
      true: 0,
      false: 0
    };

    array.forEach(data => {
      if (typeof data.isActive === 'boolean') {
        countIsActive[data.isActive.toString()]++;
      }
    });

    return Object.entries(countIsActive).map(([key, value]) => [
      key === 'true' ? 'Activo' : 'Inactivo',
      value
    ]);
  }
}

function createPreviousFilter(filters: OwnerDashboardFilter): OwnerDashboardFilter {
  const dateFrom = new Date(filters.dateFrom);
  const dateTo = new Date(filters.dateTo);

  const diffInDays = (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24);

  const newDateTo = dateFrom;
  const newDateFrom = new Date(dateFrom);
  newDateFrom.setDate(newDateFrom.getDate() - diffInDays);

  return {
    dateFrom: newDateFrom.toISOString(),
    dateTo: newDateTo.toISOString(),
    ownerType: filters.ownerType,
  };
}

function mapColumnData(array:any[]) : any{
  return array.map(data => [
    data.key,
    data.value || 0
  ]);
}

function translateTable(value: any, dictionary: { [key: string]: any }) {
  if (value !== undefined && value !== null) {
    for (const key in dictionary) {
      if (dictionary[key] === value) {
        return key;
      }
    }
  }
  console.log("Algo salio mal.");
  return;
}

function mapColumnDataT(array:any[], dictionary:any ) : any{
  return array.map(data => [
    translateTable(data.key, dictionary),
    data.value || 0
  ]);
}
