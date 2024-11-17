import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
// import { DashBoardFilters, graphModel, kpiModel } from '../../models/dashboard.model';
import { StadisticsService } from '../../services/stadistics.service';
import { KpiComponent } from '../commons/kpi/kpi.component';
import { BarchartComponent } from '../commons/barchart/barchart.component';
import { PiechartComponent } from '../commons/piechart/piechart.component';
import { graphModel, kpiModel, TicketFilter, TopPayments } from '../../models/stadistics';
import Period from '../../../expenses/models/period';
import { filter } from 'rxjs';
import {PaymentReportDto, PayMethod} from '../../models/payments.report.model';
import { TicketReportDto } from '../../models/ticket.report.model';
import {TicketStatus} from '../../models/TicketDto';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [KpiComponent, BarchartComponent, PiechartComponent],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.scss'
})
export class MainDashboardComponent implements OnInit {
  @Input() filters: TicketFilter = {} as TicketFilter;
  @Output() notifyParent: EventEmitter<string> = new EventEmitter<string>();
  // typeDictionary = VisitorTypeAccessDictionary;

  colors = [
    '#62B68F',  // rgba(98, 182, 143)
    '#FF919E',  // rgba(255, 145, 158)
    '#82B1FF',  // rgba(130, 177, 255)
    '#BB83D1',  // rgba(187, 131, 209)
    '#FFAB91',  // rgba(255, 171, 145)
    '#A2D9A5',  // rgba(162, 217, 165)
    '#95A0D9',  // rgba(149, 160, 217)
    '#FFA29A',  // rgba(255, 162, 154)
    '#7ECEC6',  // rgba(126, 206, 198)
    '#FFF59D',  // rgba(255, 245, 157)
    '#FFE082',  // rgba(255, 224, 130)
    '#DCE775',  // rgba(220, 231, 117)
    '#C4C4C4',  // rgba(196, 196, 196)
    '#BCAAAC',  // rgba(188, 170, 164)
    '#90CAF9'   // rgba(144, 202, 249)
  ];

  //vars
  kpi1: kpiModel = {} as kpiModel
  kpi2: kpiModel = {} as kpiModel
  kpi3: kpiModel = {} as kpiModel

  graph1: graphModel = {} as graphModel
  graph2: graphModel = {} as graphModel

  //Para graficos

  //redirect
  sendNotification(mode: string) {
    this.notifyParent.emit(mode);
  }
  //init
  constructor(private stadisticsService: StadisticsService) {
    this.kpi1 = {title: "Tickets Emitidos", desc: "", value: "0", icon: "bi bi-graph-up", color: "bg-success"}
    this.kpi2 = {title: "Tiempo Promedio de Resolución de Tickets", desc: "", value: "0%", icon: "bi bi-arrow-down-circle", color: "bg-info"}
    this.kpi3 = {title: "Monto total facturado", desc: "", value: "0", icon: "bi bi-person-circle", color: "bg-warning"}

    this.graph1 = {title: "Informe de total cobrado", subtitle: "", data: [], options: null}
    this.graph2 = {title: "Deuda total de propietarios", subtitle: "", data: [], options: null}
  }

  ngOnInit(): void {
    this.getData()
  }
   //getData
  getData() {
    this.getReportDinamicFilters();
  }

  getReportDinamicFilters(): void {
    this.stadisticsService.getDinamycFilterTickets(this.filters).subscribe(
      (data : TicketReportDto[] ) => {
        let totalAmount = 0;
        let totalResolutionTime = 0;
        let resolutionCount = 0;

        for (let ticket of data) {
          totalAmount += ticket.totalAmount;

          const issueDate = new Date(ticket.issueDate);
          const expirationDate = new Date(ticket.expirationDate);
          if (expirationDate > issueDate) {
            const resolutionTime = expirationDate.getTime() - issueDate.getTime();

            const resolutionTimeInDays = resolutionTime / (1000 * 3600 * 24);

            totalResolutionTime += resolutionTimeInDays;
            resolutionCount++;
          }
        }


        let resolutionAverage = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;
        this.kpi1.value = data.length.toString()
        this.kpi2.value = resolutionAverage.toFixed(2).toString() + " días"
        this.kpi3.value = "$ " + (Math.round(totalAmount * 100) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");


        this.graph1.title = "Estado de Tickets"
        this.graph1.data = this.mapTicketStatus(data)
        this.graph1.options = {...this.columnChartOptions,
          colors: this.colors}
        this.graph1.options.width = null;
        this.graph1.options.height = 500;

        this.graph2.title = "Evolución de Tickets a lo Largo del Tiempo";
        this.graph2.data = this.mapTicketsPerMonth(data)
        this.graph2.options = {
          ...this.columnChartOptions,
          hAxis: {
            title: 'Mes',
            format: 'MMM yyyy',
            slantedText: true,
            slantedTextAngle: 45,
          },
          vAxis: {
            title: 'Cantidad de Tickets',
          },
          lineWidth: 3,
          pointSize: 6,
          animation: {
            duration: 1500,
            easing: 'out',
          },
          colors: this.colors,
        };

        this.graph2.options.width = null;
        this.graph2.options.height = 500;
    },
    (error: any) => {
      console.error('Error al obtener el reporte', error);
    });
  }


  mapTicketsPerMonth(data: TicketReportDto[]): any[] {
    const ticketsPerMonth: { [key: number]: number } = {};

    data.forEach(ticket => {
      const issueDate = new Date(ticket.issueDate);
      const monthYear = new Date(issueDate.getFullYear(), issueDate.getMonth(), 1); // Primer día del mes
      const monthYearKey = monthYear.getTime();  // Utilizamos el timestamp como clave

      if (ticketsPerMonth[monthYearKey]) {
        ticketsPerMonth[monthYearKey]++;
      } else {
        ticketsPerMonth[monthYearKey] = 1;
      }
    });

    const formattedData: any[][] = [];

    Object.entries(ticketsPerMonth).forEach(([key, value]) => {
      const date = new Date(Number(key));
      formattedData.push([date, value]);
    });

    return formattedData;
  }



  mapTicketStatus(data: any[]): any[] {
    const countTicketStatus: { [key in TicketStatus]: number } = {
      [TicketStatus.PENDING]: 0,
      [TicketStatus.PAID]: 0,
      [TicketStatus.CANCELED]: 0,
      [TicketStatus.UNDER_REVIEW]: 0,
      [TicketStatus.EXPIRED]: 0,
      [TicketStatus.IN_DEFAULT]: 0,
    };

    data.forEach(item => {
      if (Object.values(TicketStatus).includes(item.status as TicketStatus)) {
        countTicketStatus[item.status as TicketStatus]++;
      }
    });

    const formattedData = Object.entries(countTicketStatus).map(([key, value]) => [
      key,
      value
    ]);

    return formattedData;
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
  //  this.getData()
  }


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
//tenia dashResponse en lugar de any
function mapColumnDataT(array:any[], dictionary:any ) : any{
  return array.map(data => [
    translateTable(data.key, dictionary),
    data.value || 0
  ]);
}
