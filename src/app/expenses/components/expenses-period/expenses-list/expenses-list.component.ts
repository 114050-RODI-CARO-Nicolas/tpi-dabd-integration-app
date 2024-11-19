import { Component, inject, OnInit, } from '@angular/core';
import { ExpenseServiceService } from '../../../services/expense.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Expense from '../../../models/expense';
import { FormsModule } from '@angular/forms';
import Period from '../../../models/period';
import {CommonModule, DatePipe} from '@angular/common';
import { PeriodService } from '../../../services/period.service';
import { LotsService } from '../../../services/lots.service';
import Lot from '../../../models/lot';
import { BillService } from '../../../services/bill.service';
import BillType from '../../../models/billType';
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {NgPipesModule} from "ngx-pipes";
import {
  MainContainerComponent,
  TableFiltersComponent, Filter,  FilterOption, SelectFilter,
} from "ngx-dabd-grupo01" ;
import {NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {InfoExpensesListComponent} from "../../modals/info-expenses-list/info-expenses-list.component";
import {MonthService} from "../../../services/month.service";
import { StorageService } from '../../../services/storage.service';
import { User } from '../../../models/user';


@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgPipesModule,
    MainContainerComponent,
    TableFiltersComponent
  ],
  providers: [DatePipe, NgbActiveModal],
  templateUrl: './expenses-list.component.html',
  styleUrl: './expenses-list.component.css'
})
export class ExpensesListComponent implements OnInit{


  modalService = inject(NgbModal);
  private route = inject(ActivatedRoute);
  private readonly periodService = inject(PeriodService)
  private readonly lotsService = inject(LotsService)
  private readonly service = inject(ExpenseServiceService)
  private readonly billService = inject(BillService)
  private readonly monthService = inject(MonthService);
  private readonly storageService = inject(StorageService)

  selectedLotId: number = 0;
  selectedTypeId: number = 0;
  selectedPeriodId: number = 0;


  searchTerm = '';
  sortField: string = 'lotId';
  sortOrder: string = 'asc';

  expenses: Expense[] = []
  lots : Lot[] = []
  tipos: BillType[] = []
  periodos : Period[] = []

  totalElements: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  visiblePages: number[] = [];
  maxPagesToShow: number = 5;


  periodPath = this.route.snapshot.paramMap.get('period_id');

  ngOnInit(): void {
    this.currentPage = 0
    const periodPath = this.route.snapshot.paramMap.get('period_id');
    if(periodPath != null) {
      this.selectedPeriodId = Number(periodPath) ;
    }
    this.loadSelect()
    this.loadExpenses();
    const user = this.storageService.getFromLocalStorage('user') as User;

  }
  loadExpenses(page: number = 0, size: number = 10): void {
    debugger
    if (this.periodPath != null) {
      this.selectedPeriodId = Number(this.periodPath)
    }
    this.service.getExpenses(page, size, this.selectedPeriodId, this.selectedLotId,this.selectedTypeId,this.sortField, this.sortOrder).subscribe(data => {
      this.expenses = data.content.map(expense => {
        const expenses = this.keysToCamel(expense) as Expense;
        return {
          ...expenses,
          month: this.getMonthName(expense.period.month),
        };

      });
      this.totalPages = data.totalPages;
      this.totalItems = data.totalElements;
      this.currentPage = data.number;
      this.updateVisiblePages();
    });
  }

  onPageSizeChange() {
    this.currentPage = 0;
    this.loadExpenses(0,this.pageSize);
  }
  applyFilters() {
    this.currentPage = 0
    this.loadExpenses();
    this.updateVisiblePages();
    }

  updateVisiblePages(): void {
    const half = Math.floor(this.maxPagesToShow / 2);
    let start = Math.max(0, this.currentPage - half);
    let end = Math.min(this.totalPages, start + this.maxPagesToShow);
    if (end - start < this.maxPagesToShow) {
      start = Math.max(0, end - this.maxPagesToShow);
    }
    this.visiblePages = [];
    for (let i = start; i < end; i++) {
      this.visiblePages.push(i);
    }

  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {

      this.loadExpenses(page, this.pageSize);
      this.updateVisiblePages();
      this.currentPage = page;
  }
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
  clearFilters() {
    this.selectedLotId = 0;
    this.selectedTypeId = 0;
    this.selectedPeriodId = 0;
    this.currentPage = 0
    this.loadExpenses();
    this.searchTerm = ''
    this.pageSize = 10
  }
  periods: FilterOption[] = [];
  lotss: FilterOption[] = []
  types: FilterOption[]= []

  filterConfig: Filter[] = [
    new SelectFilter('Lote','lot','Seleccione un lote',this.lotss),
    new SelectFilter('Tipo de lote','type','Seleccione un tipo de lote',this.types),
    new SelectFilter('Periodos','period','Seleccione un periodo',this.periods)
  ]

  toMonthAbbr(month:number){
    return this.monthService.getMonthAbbr(month);
  }

  loadSelect() {

    if (this.periodPath != null) {
      this.filterConfig.pop();
    } else {
    this.periodService.get().subscribe((data) => {
      // @ts-ignore
      this.periods.push({value: null, label: 'Todos'})
      data.forEach(item => {
        // @ts-ignore
        this.periods.push({value: item.id, label: this.toMonthAbbr(item.month)+'/'+ item.year})
      })
    })}
    this.lotsService.get().subscribe((data: Lot[]) => {
      // @ts-ignore
      this.lotss.push({value: null, label: 'Todos'})
      data.forEach(l => {
        // @ts-ignore
        this.lotss.push({value: l.id, label: l.plot_number})
      })
    })
    this.billService.getBillTypes().subscribe((data: BillType[]) => {
      // @ts-ignore
      this.types.push({ value: null, label: 'Todos' });
      data.forEach(item => {
        // @ts-ignore
        this.types.push({value: item.bill_type_id, label: item.name})
      })
    })

  }
  getMonthName(month: number): string {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month - 1];
  }


  /**
   * boton info
   */
  showInfo() {
    this.modalService.open(InfoExpensesListComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true
    });
  }

  imprimir() {
    const doc = new jsPDF();


    doc.setFontSize(18);
    doc.text('Expenses Report', 14, 20);
    this.service.getWithoutFilters(this.selectedPeriodId, this.selectedLotId, this.selectedTypeId).subscribe(expenses => {
      autoTable(doc, {
        startY: 30,
        head: [['Mes', 'Año', 'Total Amount', 'State', 'Plot Number', 'Percentage', 'Bill Type']],
        body: expenses.map(expense => [
          expense.period.month,
          expense.period.year,
          expense.totalAmount,
          expense.state,
          expense.plotNumber,
          expense.percentage,
          expense.billType
        ]),
      });
      const today = new Date();
      const formattedDate = today.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      doc.save(`Expenses_Report_${formattedDate}.pdf`);
    });
  }

  downloadTable() {
    this.service.getWithoutFilters( this.selectedPeriodId, this.selectedLotId, this.selectedTypeId).subscribe(expenses => {
      const data = expenses.map(expense => ({
        'Periodo':  `${expense?.period?.month} / ${expense?.period?.year}`,
        'Monto Total': expense.totalAmount,
        'Fecha de liquidacion': expense.liquidationDate,
        'Estado': expense.state,
        'Numero de lote': expense.plotNumber,
        'Typo de lote': expense.typePlot,
        'Porcentaje': expense.percentage,
        'Tipo de expensa': expense.billType
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
      XLSX.writeFile(wb,  'Expensas ' + formattedDate + '.xlsx');
    })}

  onFilterTextBoxChanged($event: Event) {
    const inputElement = $event.target as HTMLInputElement;
    this.searchTerm = inputElement.value;
  }

  filterChange(event: Record<string, any>) {
    this.selectedPeriodId = event['period'] || null;
    this.selectedLotId = event['lot'] || null;
    this.selectedTypeId = event['type'] || null;
    this.loadExpenses();
  }
}

