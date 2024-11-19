import {
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Charge, ChargeFilters, Charges, ChargeType, PeriodCharge } from '../../../models/charge';
import { ChargeService } from '../../../services/charge.service';
import { CategoryCharge } from '../../../models/charge';
import { ExpensesUpdateChargeComponent } from '../../modals/charges/expenses-update-charge/expenses-update-charge.component';
import { CommonModule, DatePipe } from '@angular/common';
import Lot, { Lots } from '../../../models/lot';
import { LotsService } from '../../../services/lots.service';
import { PeriodService } from '../../../services/period.service';
import { BorrarItemComponent } from '../../modals/borrar-item/borrar-item.component';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx'; // Para exportar a Excel
import jsPDF from 'jspdf'; // Para exportar a PDF
import moment from 'moment';
import { ExpensesModalComponent } from '../../modals/expenses-modal/expenses-modal.component';
import Period from '../../../models/period';
import { NgPipesModule } from 'ngx-pipes';
import {
  Filter,
  FilterConfigBuilder,
  FilterOption,
  MainContainerComponent,
  SelectFilter,
  TableColumn,
  TableFiltersComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { NgbModal,  } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import autoTable from 'jspdf-autotable';
import { ListChargesInfoComponent } from '../../modals/info/list-charges-info/list-charges-info.component';
import { ViewChargeModalComponent } from '../../modals/charges/view-charge-modal/view-charge-modal.component';
import {MonthService} from "../../../services/month.service";
import { StorageService } from '../../../services/storage.service';
import { URLTargetType } from '../../../../users/models/role';
import { User } from '../../../models/user';

@Component({
  selector: 'app-expenses-list-charges',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgPipesModule,
    ExpensesModalComponent,
    MainContainerComponent,
    TableFiltersComponent
  ],
  templateUrl: './expenses-list-charges.component.html',
  styleUrl: './expenses-list-charges.component.css',
  providers: [DatePipe],
})
export class ExpensesListChargesComponent implements OnInit {

  @ViewChild('amountTemplate', { static: true }) amountTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate', { static: true }) dateTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;
  @ViewChild('paidPdf', { static: true }) paidPdf!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
addCharge() {
  this.router.navigate(['expenses/cargos/nuevo'])
}
  private readonly monthService = inject(MonthService);  
  private storage = inject(StorageService);

  //VARIABLE DE USER
  user: User | undefined;
  rolCode: boolean= false;

  // Variables de Filtros y Paginación
  //#region FILTER VARIABLES
  searchTerm = '';
  selectedLotId: number = 0;
  selectedCategoryId: number = 0;
  selectedPeriodId: number = 0;
  TypeAmount : string = '';

  applyFilterWithNumber: boolean = false;
  applyFilterWithCombo: boolean = false;
  contentForFilterCombo: string[] = [];
  actualFilter: string | undefined = ChargeFilters.NOTHING;
  filterTypes = ChargeFilters;
  filterInput: string = '';
  columns: TableColumn[] = [];
  chargesFiltered : Charge[] = [];
  chargesOriginal: Charge[] = [];



  //#endregion

  // Variables de Carga de Datos y Paginación
  //#region DATA VARIABLES
  charges: Charge[] = [];
  chargesCompleted : Charges[] = [];
  chargeType : ChargeType[] = [ChargeType.ABSOLUTE,ChargeType.PERCENTAGE,ChargeType.NEGATIVE];
  chargeId: number = 0;
  lots: Lots[] = [];
  categorias: CategoryCharge[] = [];
  periodos: Period[] = [];
  totalElements: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  cantPages: number[] = [];
  indexActive = 1;
  isLoading: boolean = true;
  fileName: string = 'Cargos';
  selectedCharge: Charge | null = null;
  selectedCharges: number[] = [];
  params: number[] = [];
  filterSubject = new Subject<Charges[]>();
  filter$ = this.filterSubject.asObservable();
  itemsList!: Charges[];
  filterConfig: Filter[] = [];

  filterChange(event: Record<string, any>) {

    // Actualizar las variables de filtro
    this.selectedPeriodId = event['period'] || null;
    this.selectedLotId = event['lot'] || null;
    this.selectedCategoryId = event['categoryCharge'] || null;
    this.TypeAmount = event['chargeType'] || undefined;
    this.cargarPaginado();
  }
  categoriasCargos :FilterOption[] = [];
  periodosFilters : FilterOption[]= [];
  lotsFilters : FilterOption[] = [];
  filters : Filter[] = [
    new SelectFilter('Categoria','category','Seleccione la categoria',this.categoriasCargos),
    new SelectFilter('Lote','lot','Seleccione un lote',this.lotsFilters),
    new SelectFilter('Periodo','period','Seleccione un periodo',this.periodosFilters)

  ];


  //#endregion

  // Servicios Inyectados
  //#region INJECTED SERVICES
  private chargeService = inject(ChargeService);
  private modalService = inject(NgbModal);
  private readonly router = inject(Router);
  private readonly periodService = inject(PeriodService);
  private readonly lotsService = inject(LotsService);
  toastService: ToastService = inject(ToastService);
  //#endregion

  // Métodos de Filtro y Paginación
  //#region FILTER OPERATIONS
  applyFilters() {
    this.currentPage = 0;
    this.cargarPaginado();
  }

  clearFilters() {
    this.selectedCategoryId = 0;
    this.selectedLotId = 0;
    this.selectedPeriodId = 0;
    this.cargarPaginado();
    this.searchTerm = '';
  }

  toMonthAbbr(month:number){
    return this.monthService.getMonthAbbr(month);
  }

  createFilters() {
    this.filterConfig = new FilterConfigBuilder()

    .selectFilter('Periodo', 'period', 'Seleccione un periodo', this.periodos.map(periodo => ({
      value: periodo.id.toString(),
      label: (this.toMonthAbbr(periodo.month)+'/'+ periodo.year)
    })))
  .selectFilter('Categoría', 'categoryCharge', 'Seleccione una categoría', this.categorias.map(category => ({
    value: category.categoryChargeId.toString(),
    label: category.name
  })))
  .selectFilter('Lote','lot','Seleccione un lote', this.lots.map(lot => ({
    value: lot.id.toString(),
    label: lot.plot_number.toString()
  })))
  .selectFilter('Tipo de Cargo','chargeType','Seleccione un tipo', this.chargeType.map(type => ({
    value : type,
    label : type.toString()
  })))
  .build()
  }



  //#endregion

  // Métodos de Carga de Datos
  //#region DATA LOADING
  ngOnInit(): void {    
    this.user = this.storage.getFromSessionStorage('user') as User;

    this.rolCode = this.user.value.roles.filter(rol => rol.code === URLTargetType.FINANCE || rol.code === URLTargetType.SUPERADMIN ).length == 1 ? true : false
    this.loadSelect();
    this.cargarPaginado();    
  }

  loadSelect() {
    forkJoin({
      periodos: this.periodService.get(),
      lots: this.lotsService.get(),
      categories: this.chargeService.getCategoryCharges(false),
    }).subscribe({
      next: ({ periodos, lots, categories }) => {
        this.periodos = periodos;
        periodos.forEach(periodo => {
          this.periodosFilters.push({
            value: periodo.id.toString(),
            label: (periodo.month +'/'+ periodo.year),
          });
        });

        this.lots = lots;
        lots.forEach(lot => {
          this.lotsFilters.push({
            value: lot.id.toString(),
            label: lot.plot_number.toString(),
          });
        });

        categories.forEach(category => {
          this.categoriasCargos.push({
            value: category.categoryChargeId.toString(),
            label: category.name,
          });
        })
        this.categorias = categories;
        this.createFilters();
        this.cargarPaginado();
      },
      error: (error) => {
      }
    });
  }

  loadCategoryCharge() {
    this.chargeService
      .getCategoryCharges(true)
      .subscribe((data: CategoryCharge[]) => {
        this.categorias = data;
        this.createFilters();
      });
  }

  loadCharges(page: number, pageSize: number): void {
    this.chargeService.getCharges(page, pageSize).subscribe((charges) => {
      this.charges = charges.content;
    });
  }

  getChargeType(value: string): ChargeType | undefined {
    const entry = Object.entries(ChargeType).find(([_, v]) => v === value);
    return entry ? ChargeType[entry[0] as keyof typeof ChargeType] : undefined;
}

  cargarPaginado() {
    const period = this.selectedPeriodId || undefined;
    const category = this.selectedCategoryId || undefined;
    const lot = this.selectedLotId || undefined;
    const type = this.getChargeType(this.TypeAmount) || undefined;

    this.chargeService
      .getCharges(this.currentPage, this.pageSize, period, lot, category,type)
      .subscribe((response) => {
        this.charges = response.content;
        this.charges = response.content.map(charge => {
          const charges = this.keysToCamel(charge) as Charge; //Cambiar de snake_Case a camelCase
          return {
            ...charges,
            plotNumber: this.getPlotNumber(charge.lotId), //
          };

        });
        this.loadChargesCompleted();
        this.totalPages = response.totalPages;
        this.totalItems = response.totalElements;
        this.currentPage = response.number;
      });
  }


  loadChargesCompleted() {
    this.chargesCompleted = this.charges.map(charge => ({
      ...charge,
      plotNumber: this.getPlotNumber(charge.lotId),
    }));
  }
  //#endregion

  // Métodos de Exportación e Impresión
  //#region EXPORT & PRINT
  imprimir() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Cargos', 14, 20);

    this.chargeService
      .getCharges(
        0,
        100000,
        this.selectedPeriodId,
        this.selectedLotId,
        this.selectedCategoryId,
        this.getChargeType(this.TypeAmount) || undefined
      )
      .subscribe((charges) => {
        charges.content  = this.keysToCamel(charges.content);
        autoTable(doc, {
          startY: 30,
          head: [
            [ 'Periodo','Fecha', 'Lote', 'Categoría', 'Descripción', 'Monto'],
          ],
          body: charges.content.map((charge) => [
            `${charge.period.month}/${charge.period.year}`,
            moment(charge.date).format('DD/MM/YYYY'),
            this.getPlotNumber(charge.lotId) || 'N/A',
            charge.categoryCharge.name,
            charge.description,
            this.getSign(charge.amount, charge.amountSign)  ,
          ]),
          columnStyles: {
            5: { halign: 'right' }, // Alinea la sexta columna (índice 5) a la derecha
          },
        });

        const fecha = new Date();
        this.fileName += `-${fecha.getDate()}_${
          fecha.getMonth() + 1
        }_${fecha.getFullYear()}.pdf`;
        doc.save(this.fileName);
      });
  }

  getSign(amount : number,sign : string){
    switch(sign){
      case ChargeType.ABSOLUTE:
        return '$'+amount;
      case ChargeType.NEGATIVE:
        return '$' + amount;
      case ChargeType.PERCENTAGE:
        return amount +'%';
      default:
        return '';
    }
  }

  downloadTable() {
    this.chargeService
      .getCharges(
        0,
        100000,
        this.selectedPeriodId,
        this.selectedLotId,
        this.selectedCategoryId
      )
      .subscribe((charges) => {
        const chargesAll = this.keysToCamel(charges.content)
        const data = chargesAll.map((charge : Charge) => ({
          Periodo: `${charge.period.month}/${charge.period.year}`,
          'Fecha de Carga': moment(charge.date).format('DD/MM/YYYY'),
          'Número de lote': this.getPlotNumber(charge.lotId),
          Categoria: charge.categoryCharge.name,
          Descripción: charge.description,
          'Tipo de valor': charge.amountSign,
          Monto: charge.amount,
          Estado: charge.status,
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cargos');

        const fecha = new Date();
        this.fileName += `-${fecha.getDate()}_${
          fecha.getMonth() + 1
        }_${fecha.getFullYear()}.xlsx`;
        XLSX.writeFile(wb, this.fileName);
      });
  }
  //#endregion

  // Métodos de Modales
  //#region MODALS
  showInfo() {
    this.modalService.open(ListChargesInfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });
  }
  open(content: TemplateRef<any>, id: number | null) {
    this.chargeId = id || 0;
    const modalRef = this.modalService.open(content);
    modalRef.componentInstance.onAccept.subscribe(() =>
      this.deleteCharge(this.chargeId)
    );
  }

  openViewModal(charge: Charge) {
    const modalRef = this.modalService.open(ViewChargeModalComponent, {
      size: 'lg' // 'lg' para grande o 'xl' para extra grande
    });
    modalRef.componentInstance.charge = charge;

  }

  openDeleteModal(chargeId: number) {
    const modalRef = this.modalService.open(BorrarItemComponent);
    modalRef.componentInstance.chargeId = chargeId;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.deleteCharge(result);
          this.cargarPaginado();
        }
      },
      () => {}
    );
  }

  openUpdateModal(charge: Charge) {
    const modalRef = this.modalService.open(ExpensesUpdateChargeComponent, {
      size: 'lg' // 'lg' para grande o 'xl' para extra grande
    });
    modalRef.componentInstance.charge = charge;
    modalRef.componentInstance.isEditing = true;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.currentPage = 0;
          this.cargarPaginado();
          this.toastService.sendSuccess(
            'Se ha actualizado el cargo correctamente'
          );
        }
      },
      () => {}
    );
  }
  //#endregion

  // Operaciones de Eliminación
  //#region DELETE OPERATIONS
  deleteCharge2() {
    if (this.chargeId) {
      this.deleteCharge(this.chargeId);
    }
  }

  deleteCharge(chargeId: number) {
    this.chargeService.deleteCharge(chargeId).subscribe({
      next: () => {
        this.currentPage = 0;
        this.clearFilters();
        this.cargarPaginado();
        this.toastService.sendSuccess('Se ha eliminado el cargo correctamente');
      },
      error: () => {
        this.toastService.sendError(
          'Ha ocurrido un error al eliminar el cargo'
        );
      },
    });
    this.chargeId = 0;
  }
  //#endregion

  // Otros Métodos
  //#region OTHER METHODS
  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadCharges(page, this.pageSize);
      this.currentPage = page;
    }
  }

  changesPageSize(newRowsPerPage: number) {
    this.currentPage = 0;
    this.pageSize = newRowsPerPage;
    this.cargarPaginado();
  }

  onSelectChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.pageSize = Number(selectElement.value);
  }

  getPlotNumber(lotId: number) {
    const lot = this.lots.find((lot) => lot.id === lotId);
    return lot ? lot.plot_number : undefined;
  }

  isClosed(period: PeriodCharge): boolean {
    return period.state === 'closed';
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

  isFine(name :String){
    return name.toLowerCase().includes("multa");
  }

  //#endregion
}
