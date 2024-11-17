import { ChangeDetectorRef, Component, Inject, inject, Input, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MainContainerComponent } from "ngx-dabd-grupo01";
import { NgbModal, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { GoogleChartsModule } from "angular-google-charts";
import { KpiComponent } from "../commons/kpi/kpi.component";

import { CommonModule, NgClass } from "@angular/common";
import { DashboardStatus, PaymentFilter, TicketFilter } from '../../models/stadistics';
import { MainDashboardComponent } from '../main-dashboard/main-dashboard.component';
import { BarchartComponent } from '../commons/barchart/barchart.component';
import { StadisticsService } from '../../services/stadistics.service';
import { InfoComponent } from '../../info/info.component';
import { DistributionPaymentMethodsComponent } from "../distribution-payment-methods/distribution-payment-methods.component";
import { TotalPaymentsComponent } from '../total-payments/total-payments.component';
import { ActivatedRoute } from '@angular/router';
// import { DashBoardFilters } from '../../models/dashboard.model';

@Component({
  selector: 'app-stadistics',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MainContainerComponent, // Verifica si es standalone o usa su módulo
    GoogleChartsModule, // Verifica si es compatible
    NgbPopoverModule,
    MainDashboardComponent,
    DistributionPaymentMethodsComponent,
    DistributionPaymentMethodsComponent,
    TotalPaymentsComponent,
    CommonModule
  ],
  templateUrl: './stadistics.component.html',
  styleUrl: './stadistics.component.css'
})
export class StadisticsComponent implements OnInit {
  //Bandera para mostrar
  idType: number = 0;
  private dataLoaded = false;
  //filters
  ticketFilter: TicketFilter = {} as TicketFilter
  paymentFilter: PaymentFilter = {} as PaymentFilter
  // filters: DashBoardFilters = {} as DashBoardFilters;

  //dashboard settings
  status: DashboardStatus = DashboardStatus.All;


  //services
  modalService = inject(NgbModal);


  //Childs
  @ViewChild(MainDashboardComponent) main!: MainDashboardComponent;
  @ViewChild(TotalPaymentsComponent) payments!: TotalPaymentsComponent;


  @ViewChild(BarchartComponent) barchartComponent!: BarchartComponent;

  @ViewChild('infoModal') infoModal!: TemplateRef<any>
  dateFilterForm: FormGroup;
  dateFilterFormPayments: FormGroup;
  errorMessage: string ='';


  constructor(private fb: FormBuilder,
    private stadisticsService: StadisticsService, private route: ActivatedRoute,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef) {

      this.dateFilterForm = this.fb.group(
        {
          firstDate: ['', Validators.required],
          lastDate: ['', Validators.required],
        },
        {
          validators: this.dateRangeValidator,
        }
      );
      this.dateFilterFormPayments = this.fb.group(
        {
          firstDate: [''],
          lastDate: ['']
        },
        {
          validators: this.dateRangeValidator
        }
      );
      
  }

    // Validación personalizada para comprobar que la fecha de fin es mayor que la fecha de inicio
    dateRangeValidator(form: FormGroup) {
      const start = form.get('firstDate')?.value;
      const end = form.get('lastDate')?.value;
    
      // Si no hay fecha de fin (`end`), la validación es válida
      if (!end) {
        return null;
      }
    
      const startDate = new Date(start);
      const endDate = new Date(end);
    
      // Verifica que la fecha de fin sea mayor que la de inicio
      return endDate > startDate ? null : { dateRangeInvalid: true };
    }
    
    onDateChange() {
      if (this.dateFilterForm.invalid || !this.dateFilterForm.get('lastDate')?.value) {
        this.errorMessage = ''; // No muestra el mensaje si no hay `endDate`
      } else {
        this.errorMessage = ''; // Limpia el mensaje de error si es válido
        this.filterData();
      }
    }
  // INICIAMOS COMPONENTE CON FORMULARIO NUEVO Y CARGA DE FECHA INICIAL ACTUAL FORMATO "YYYY-MM"
  ngOnInit(): void {


    this.route.params.subscribe(params => {
      this.idType = +params['id'];
      this.filterData(); // Actualiza los datos cada vez que el id cambie
      this.filterDataPayment();
    });


    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);

    this.dateFilterForm.patchValue({
      firstDate: currentMonth
    });


    this.dateFilterForm.get('firstDate')?.valueChanges.subscribe(value => {
      // this.filterData();
    });

    this.dateFilterForm.get('lastDate')?.valueChanges.subscribe(value => {
      // this.filterData();
    });

    this.dateFilterForm.valueChanges.subscribe(values => {
      // this.filterData();
    });
  }
  ngAfterViewChecked(): void {
    if (!this.dataLoaded) { // Ejecuta solo si no ha sido cargado
      if (this.main) {
        this.filterData();
      } else {
        console.error('MainDashboardComponent no está disponible.');
      }
    
      if (this.payments) {
        this.filterDataPayment();
      } else {
        console.error('TotalPaymentsComponent no está disponible.');
      }
    
      this.dataLoaded = true; // Establece la bandera como cargado
      this.cdr.detectChanges(); // Fuerza la detección de cambios
    }
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.main) {
        this.filterData();
      }
  
      if (this.payments) {
        this.filterDataPayment();
      }
  
      this.cdr.detectChanges(); // Fuerza la detección de cambios
    }, 0);
  }
  
  
 


  initializeDefaultDates() {
    // this.dateFilterForm.patchValue({
    //   firstDate: "2024-01",
    //   lastDate: "2024-03"
    // })

    this.ticketFilter = {
      status: "",
      startExpirationDate: "",
      endExpirationDate: ""
    };

    this.filterData();
  }

  resetFilters() {
    this.initializeDefaultDates();
    this.filterData()
  }

  filterData() {
    if (this.main && this.main.getData) {
      this.main.getData();
    } else {
      console.error('El método getData no está disponible en MainDashboardComponent.');
    }
  }
  
  filterDataPayment() {
    if (this.payments && this.payments.getData) {
      this.payments.getData();
    } else {
      console.error('El método getData no está disponible en TotalPaymentsComponent.');
    }
  }
  

  resetFiltersPayment() {
    this.initializeDefaultDatesPayment();
  }

  initializeDefaultDatesPayment() {
    this.paymentFilter = {
      status: "",
      paymentMethod: "",
      startCreatedAt: "",
      endCreatedAt: ""
    }

    this.filterDataPayment()
  }

  protected readonly DashboardStatus = DashboardStatus;


  // ACA SE ABRE EL MODAL DE INFO
  showInfo(): void {
    const modalRef = this.modalService.open(InfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });
  }


  onInfoButtonClick() {
    this.modalService.open(this.infoModal, { size: 'lg' });
  }
}
