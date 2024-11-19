import {
  Component,
  ElementRef,
  Input,
  LOCALE_ID,
  OnInit,
  ViewChild,
  NgModule,
} from '@angular/core';
import { TicketDetail, TicketDto, TicketStatus } from '../models/TicketDto';
import { CommonModule, registerLocaleData } from '@angular/common';
import { MercadoPagoServiceService } from '../services/mercado-pago-service.service';
import { TicketPayDto } from '../models/TicketPayDto';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TicketService } from '../services/ticket.service';
import { HttpClient } from '@angular/common/http';
import {
  Filter,
  FilterConfigBuilder,
  FilterOption,
  MainContainerComponent,
  TableComponent,
  TableFiltersComponent,
} from 'ngx-dabd-grupo01';
import { NgbModal, NgbModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { TranslateStatusTicketPipe } from '../pipes/translate-status-ticket.pipe';
import { CapitalizePipe } from '../pipes/capitalize.pipe';
import { InfoComponent } from '../info/info.component';
import { DatePipe } from '@angular/common';

import localeEs from '@angular/common/locales/es';
import jsPDF from 'jspdf';
import { PaginatedResponse } from '../models/api-response';
import autoTable from 'jspdf-autotable';
import { PaymentExcelService } from '../services/payment-excel.service';
import { FilesServiceService } from '../services/files.service.service';
import { PeriodToMonthYearPipe } from '../pipes/period-to-month-year.pipe';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';
import { PaymentServiceService } from '../services/payment-service.service';
import { RequestTicketOwner } from '../models/RequestTicket';

registerLocaleData(localeEs, 'es');
@Component({
  selector: 'app-owner-list-expensas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MainContainerComponent,
    NgbPagination,
    TranslateStatusTicketPipe,
    CapitalizePipe,
    TableFiltersComponent,
    NgbModule,
    PeriodToMonthYearPipe,
    CurrencyFormatPipe,
  ],
  templateUrl: './owner-list-expensas.component.html',
  styleUrl: './owner-list-expensas.component.css',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' },
    PeriodToMonthYearPipe,
  ],
})
export class OwnerListExpensasComponent {

  
  //#region ATT de PAGINADO
  currentPage: number = 0;
  pageSize: number = 10;
  sizeOptions: number[] = [10, 25, 50];
  ticketOwnerList: TicketDto[] = [];
  filteredTicketList: TicketDto[] = [];
  lastPage: boolean | undefined;
  totalItems: number = 0;
  filteroptions: FilterOption[] = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'PAID', label: 'Pagado' },
    { value: 'CANCELED', label: 'Anulado' },
    { value: 'UNDER_REVIEW', label: 'En revisión' },
    { value: 'EXPIRED', label: 'Vencido' },
    { value: 'IN_DEFAULT', label: 'Vencido2' },
  ];
  eventSaved!: Record<string, any>;
  filterConfig: Filter[] = new FilterConfigBuilder()
    .selectFilter('Estado', 'status', 'Estado', this.filteroptions)
    .numberFilter('Año desde', 'initYear', 'Seleccione un año ')
    .selectFilter('Mes desde', 'initMonth', 'Seleccione un mes', [
      { value: '01', label: 'Enero' },
      { value: '02', label: 'Febrero' },
      { value: '03', label: 'Marzo' },
      { value: '04', label: 'Abril' },
      { value: '05', label: 'Mayo' },
      { value: '06', label: 'Junio' },
      { value: '07', label: 'Julio' },
      { value: '08', label: 'Agosto' },
      { value: '09', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' },
    ])
    .numberFilter('Año hasta', 'endYear', 'Seleccione un año ')
    .selectFilter('Mes hasta', 'endMonth', 'Seleccione un mes', [
      { value: '01', label: 'Enero' },
      { value: '02', label: 'Febrero' },
      { value: '03', label: 'Marzo' },
      { value: '04', label: 'Abril' },
      { value: '05', label: 'Mayo' },
      { value: '06', label: 'Junio' },
      { value: '07', label: 'Julio' },
      { value: '08', label: 'Agosto' },
      { value: '09', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' },
    ])
    .build();

  @ViewChild('ticketsTable', { static: true })
  tableName!: ElementRef<HTMLTableElement>;

  requestData: TicketPayDto = {
    idTicket: 0,
    title: '',
    description: '',
    totalPrice: 0,
    adminNameWhoApproves: '',
    period: ''
  };
  isFilter: boolean = false; // to keep the status to avoid load all values from backend

  requestTicketOwner: RequestTicketOwner = {
    ownerId: 0,
    status: null,
    firstPeriod: null,
    lastPeriod: null,
  };

  // Método que detecta cambios en los filtros
  filterChange($event: Record<string, any>) {
    console.log($event); // Muestra los valores actuales de los filtros en la consola
    this.eventSaved = $event;
    this.isFilter = true;
    if (!this.ticketService.isValidYearFilter($event['initYear']) || !this.ticketService.isValidYearFilter($event['endYear'])) {
      return;
    }
    const initYear = this.ticketService.cutYearFilter($event['initYear']);
    const endYear = this.ticketService.cutYearFilter($event['endYear']);
    const monthInit = $event['initMonth'];
    const monthEnd = $event['endMonth'];

    const concatDateInit = !this.ticketService.isValidPeriod(initYear, monthInit) ? `${monthInit}/${initYear}` : '/';
    const concatDateEnd = !this.ticketService.isValidPeriod(monthEnd, endYear) ? `${monthEnd}/${endYear}` : '/';

    if (!this.ticketService.isValidateFullDate($event['initYear'], $event['initMonth'])) {
      return;
    }


    this.ticketService
      .getAllWithFilters(
        this.currentPage--,
        this.pageSize,
        $event['status'],
        $event['lotId'],
        concatDateInit == '/' ? '' : concatDateInit,
        concatDateEnd == '/' ? '' : concatDateEnd
      )
      .subscribe(
        (response: PaginatedResponse<TicketDto>) => {
          console.log(response.content);
          this.ticketOwnerList = response.content;
          this.filteredTickets = response.content;
          this.lastPage = response.last;
          this.totalItems = response.totalElements;
        },
        (error) => {
          console.error('Error al obtener los tickets con filtros:', error);
        },
        () => {
          console.log('Obtención de tickets con filtros completada.');
        }
      );
    // // Verifica si el filtro de estado tiene un cambio específico
    // if ($event['status']?.includes("PAGADO")) {
    //   this.onPaidStatusSelected();
    // }
  }


  ticketSelectedModal: TicketDto = {
    id: 0,
    ownerId: { id: 1, first_name: 'Esteban', last_name: '', second_name: '' },
    issueDate: new Date(),
    expirationDate: new Date(),
    status: TicketStatus.PENDING,
    ticketNumber: 'xx',
    lotId: 0,
    ticketDetails: [
      { id: 1, amount: 20, description: 'Description of Item A' },
    ],
    urlTicket: '',
    period: '',
  };
  isButtonInitialized: boolean = false;
  // listallticket: TicketDto[] = [];
  filteredTickets: TicketDto[] = [];
  fechasForm: FormGroup;

  selectedFile: File | null = null;

  constructor(
    private mercadopagoservice: MercadoPagoServiceService,
    private formBuilder: FormBuilder,
    private ticketService: TicketService,
    private http: HttpClient,
    private modalService: NgbModal,
    private datePipe: DatePipe,
    private excelService: PaymentExcelService,
    private fileService: FilesServiceService,
    private periodToMonthYearPipe: PeriodToMonthYearPipe,
    private paymentService: PaymentServiceService
  ) {
    this.fechasForm = this.formBuilder.group({
      fechaInicio: [''],
      fechaFin: [''],
    });
  }
  ngOnInit() {


    const userData = sessionStorage.getItem('user');

    if (userData) {
      const parsedData = JSON.parse(userData);

      const userId = parsedData.value.owner_id;
      this.requestTicketOwner.ownerId = userId;
     
      console.log('User ID:', userId);
    } else {
      console.log('No user data found in sessionStorage.');
    }
    this.ticketService.getAllByOwner(this.requestTicketOwner, this.currentPage, this.pageSize).subscribe(
      (response) => {
        console.log('Tickets del propietario:', response);
        this.ticketOwnerList = response.content; // Lista original de tickets
        this.filteredTickets = [...this.ticketOwnerList]; // Inicializa los tickets filtrados con los datos originales
        this.totalItems = response.totalElements; // Total de elementos para paginación
        this.lastPage = response.last; // Verifica si es la última página
      },
      (error) => {
        console.error('Error al obtener los tickets del propietario', error);
      }
    );
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onFilterTextBoxChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    const filterText = target.value.toLowerCase();
    if (filterText.length <= 2) {
      // Restaura la lista completa si el texto del filtro tiene menos de 3 caracteres
      this.filteredTickets = [...this.ticketOwnerList];
    } else {
      debugger;
      // Filtra los tickets visibles en la tabla
      this.filteredTickets = this.ticketOwnerList.filter((ticket) =>
        this.matchVisibleFields(ticket, filterText)
      );
    }
  }
  // Función de coincidencia solo en los campos visibles
  matchVisibleFields(ticket: TicketDto, filterText: string): boolean {
    // Combina las propiedades visibles en un solo texto y verifica si contiene el filtro
    // const propietario = `${ticket.ownerId.first_name} ${ticket.ownerId.second_name} ${ticket.ownerId.last_name}`.toLowerCase();
    // const lote = ticket.lotId.toString();
    const periodo = this.formatPeriodo(ticket.period);
    const total = this.calculateTotal(ticket).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    });
    const estado = this.translateStatus(ticket.status).toLowerCase();

    return (
      // propietario.includes(filterText) ||
      // lote.includes(filterText) ||
      periodo.includes(filterText) ||
      total.includes(filterText) ||
      estado.includes(filterText)
    );
  }

  //Funcion formate el periodo 01/24 a Enero 2024
  formatPeriodo(period: string): string {
    const [month, year] = period.split('/');
    const date = new Date(+year, +month - 1, 1);
    return this.datePipe.transform(date, 'MMMM yyyy', 'es-ES')!;
  }

  // Traduce el estado del ticket a español
  translateStatus(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.PAID:
        return 'Pagado';
      case TicketStatus.CANCELED:
        return 'Anulado';
      case TicketStatus.PENDING:
        return 'Pendiente';
      case TicketStatus.UNDER_REVIEW:
        return 'En revisión';
      case TicketStatus.EXPIRED:
        return 'Vencido';
      case TicketStatus.IN_DEFAULT:
        return 'Vencido2';
      default:
        return '';
    }
  }

  downloadTicket(ticket: TicketDto) {
    this.fileService.downloadFile(ticket.urlTicket).subscribe((response) => {
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ticket.urlTicket.split('/').pop() || 'download.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  isUploading = false;
  uploadSuccess: boolean | null = null;

  onUpload(): void {
    if (!this.selectedFile) {
      console.warn('No file selected!');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.requestData.idTicket = this.ticketSelectedModal.id;
    this.requestData.description = `Expensas del periodo ${this.periodToMonthYearPipe.transform(
      this.ticketSelectedModal.period
    )}`;
    this.requestData.title = `Expensas del periodo ${this.periodToMonthYearPipe.transform(
      this.ticketSelectedModal.period
    )}`;
    this.requestData.totalPrice = this.calculateTotal(this.ticketSelectedModal);
    this.requestData.adminNameWhoApproves = 'ADMIN USER';
    this.requestData.period = this.ticketSelectedModal.period;
    // Agregar el JSON como un string en el FormData
    // const jsonData = {
    //   idTicket: 123,
    //   title: "Concert Ticket",
    //   description: "Ticket for the annual concert",
    //   totalPrice: 150.00

    // };
    formData.append('ticketPayDtoJson', JSON.stringify(this.requestData));

    // Opcional: indicar que el archivo está en proceso de subida
    this.isUploading = true;

    this.http
      .post('http://localhost:8090/payments/saveReceipt', formData)
      .subscribe(
        (response) => {
          console.log('File uploaded successfully!', response);
          this.isUploading = false;
          this.uploadSuccess = true;

        },
        (error) => {
          console.error('Error uploading file:', error);
          this.isUploading = false;
          this.uploadSuccess = false;
        }
      );
  }

  //#region FUNCIONES PARA PAGINADO
  onItemsPerPageChange() {
    --this.currentPage;
  }
  enviarFechas() {
    const fechas = this.fechasForm.value;
    console.log('Fechas Enviadas:', fechas);
    this.ticketService.filtrarfechas(fechas).subscribe(
      (filteredTickets: TicketDto[]) => {
        this.filteredTickets = filteredTickets;
      },
      (error) => {
        console.error('Error al filtrar tickets por fechas:', error);
      }
    );
  }

  calculateTotal(ticket: TicketDto): number {
    let total = 0;
    if (ticket && ticket.ticketDetails) {
      total = ticket.ticketDetails.reduce((acc, item: TicketDetail) => {
        return acc + item.amount;
      }, 0);
    }
    return total;
  }

  selectTicket(ticket: TicketDto) {
    this.ticketSelectedModal = ticket;
    this.pagar();
  }

  onPageChange(page: number) {
    this.currentPage = --page;
    if (!this.isFilter) {
      this.getTickets();
    } else {
      this.filterChange(this.eventSaved);
    }
    this.currentPage++;
  }

  // Método para obtener todos los tickets usando el servicio
  getTickets(): void {


    const userData = sessionStorage.getItem('user');

    if (userData) {
      const parsedData = JSON.parse(userData);

      const userId = parsedData.value.owner_id;
      this.requestTicketOwner.ownerId = userId;
     
      console.log('User ID:', userId);
    } else {
      console.log('No user data found in sessionStorage.');
    }
    this.ticketService
      .getAllByOwner(this.requestTicketOwner, this.currentPage, this.pageSize)
      .subscribe({
        next: (response: PaginatedResponse<TicketDto>) => {
          console.log('Tickets received:', response.content);
          this.ticketOwnerList = response.content;
          this.filteredTickets = response.content;
          this.lastPage = response.last;
          this.totalItems = response.totalElements;
        },
        error: (error) => {
          console.error('Error al obtener los tickets:', error);
        },
        complete: () => {
          console.log('Obtención de tickets completada.');
        },
      });
  }

  pagar() {
    this.requestData.idTicket = this.ticketSelectedModal.id;
    this.requestData.description = `Expensas del periodo ${this.periodToMonthYearPipe.transform(
      this.ticketSelectedModal.period
    )}`;
    this.requestData.title = `Expensas del periodo ${this.periodToMonthYearPipe.transform(
      this.ticketSelectedModal.period
    )}`;
    this.requestData.totalPrice = this.calculateTotal(this.ticketSelectedModal);
    console.log(this.requestData);
    this.mercadopagoservice.crearPreferencia(this.requestData).subscribe(
      (response) => {
        console.log('Preferencia creada:', response);

        if (!this.isButtonInitialized) {
          this.mercadopagoservice.initMercadoPagoButton(response.id);
          this.isButtonInitialized = true;
        }

        // this.mercadopagoservice.initMercadoPagoButton(response.id);
      },
      (error) => {
        console.error('Error al crear la preferencia:', error);
      }
    );
  }

  // ACA SE ABRE EL MODAL DE INFO
  showInfo(): void {
    const modalRef = this.modalService.open(InfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });

    modalRef.componentInstance.data = { role: 'owner' };
  }

  LIMIT_32BITS_MAX = 2147483647;

  @Input() objectName: string = '';
  /**
   * Export the HTML table to a PDF file.
   * Calls the `exportTableToPdf` method from the `CadastreExcelService`.
   */
  exportToPdf() {
    const doc = new jsPDF();

    // Título del PDF
    doc.setFontSize(18);
    doc.text('Tickets Report', 14, 20);

    this.ticketService
      .getAllTicketsPageForExports(0, this.LIMIT_32BITS_MAX)
      .subscribe(
        (response: PaginatedResponse<TicketDto>) => {
          // Accede a la propiedad `content` que contiene los tickets
          const expenses = response.content;

          autoTable(doc, {
            startY: 30,
            head: [['Propietario', 'Periodo', 'Estado']],
            body: expenses.map((expense: TicketDto) => [
              `${expense.ownerId.first_name} ${expense.ownerId.last_name}`,
              expense.issueDate instanceof Date
                ? expense.issueDate.toLocaleDateString()
                : new Date(expense.issueDate).toLocaleDateString(),
              this.translateStatus(expense.status),
            ]),
          });

          // Guarda el PDF después de agregar la tabla
          doc.save('expenses_report.pdf');
        },
        (error) => {
          console.error('Error retrieved all, on export component.', error);
        }
      );
  }

  /**
   * Export the HTML table to an Excel file (.xlsx).
   * Calls the `exportTableToExcel` method from the `CadastreExcelService`.
   */
  //#region TIENEN QUE MODIFICAR EL SERIVCIO CON SU GETALL
  exportToExcel() {
    this.ticketService
      .getAllTicketsPageForExports(0, this.LIMIT_32BITS_MAX)
      .subscribe(
        (response) => {
          const modifiedContent = response.content.map(
            ({ id, ownerId, ...rest }) => rest
          );
          this.excelService.exportListToExcel(
            modifiedContent,
            `${this.getActualDayFormat()}_${this.objectName}`
          );
        },
        (error) => {
          console.log('Error retrieved all, on export component.');
        }
      );
  }

  getActualDayFormat() {
    const today = new Date();

    const formattedDate = today.toISOString().split('T')[0];

    return formattedDate;
  }
}
