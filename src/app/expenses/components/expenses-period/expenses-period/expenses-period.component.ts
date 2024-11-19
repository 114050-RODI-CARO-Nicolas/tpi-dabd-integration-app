import { Component, inject, OnInit } from '@angular/core';
import { ExpenseServiceService } from '../../../services/expense.service';
import Expense from '../../../models/expense';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
  ToastService,
  FilterConfigBuilder,
  MainContainerComponent,
  TableFiltersComponent,
  Filter,
} from 'ngx-dabd-grupo01';
import { switchMap, tap } from 'rxjs';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-expenses-period',
  standalone: true,
  imports: [NgbModule, FormsModule, MainContainerComponent,TableFiltersComponent],
  templateUrl: './expenses-period.component.html',
  styleUrl: './expenses-period.component.css',
  providers: [DatePipe, NgbActiveModal, NgbModule, NgbModal],

})
export class ExpensesPeriodComponent implements OnInit {

  showModal() {
    throw new Error('Method not implemented.');
  }

  finde() {
    this.loadList();
  }
  toastService: ToastService = inject(ToastService);
  cantPages: number = 1;
  indexActive = 1;
  size = 10;
  currentPage: number = 1;
  visiblePages: number[] = [];
  type: number | undefined = undefined;
  lote: number | null = null;
  filter: string | null = null;

  filterConfig: Filter[] = new FilterConfigBuilder()
    .numberFilter('Año', 'year', 'Seleccione un año')
    .selectFilter('Mes', 'month', 'Seleccione un mes', [
      { value: '1', label: 'Enero' },
      { value: '2', label: 'Febrero' },
      { value: '3', label: 'Marzo' },
      { value: '4', label: 'Abril' },
      { value: '5', label: 'Mayo' },
      { value: '6', label: 'Junio' },
      { value: '7', label: 'Julio' },
      { value: '8', label: 'Agosto' },
      { value: '9', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' },
    ])
    .radioFilter('Activo', 'estate', [
      { value: 'OPEN', label: 'Activos' },
      { value: 'CLOSE', label: 'Finalizados' },
      { value: 'null', label: 'Todo' },
    ])
    .build();

  changeFilter(filter: string | null) {
    if (!filter) {
      debugger
      this.lote = null;
      this.loadList();
    }
    this.filter = filter;
  }

  onSelectChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.size = Number(selectElement.value);
    this.loadList();
  }

  selectType(arg0: string | undefined) {
    if (arg0 === 'Ordinarias') {
      this.type = 1;
    }
    if (arg0 === 'Extraordinarias') {
      this.type = 2;
    }
    if (!arg0) {
      this.type = undefined;
    }
    this.loadList();
  }

  ngOnInit(): void {
    this.loadId();
    this.loadList();
  }

  private expenseService: ExpenseServiceService = inject(ExpenseServiceService);
  private route = inject(ActivatedRoute);
  periodId: string | null = null;
  listExpenses: Expense[] = [];

  loadList() {
      if (!this.periodId) {
      this.toastService.sendError('Debe seleccionar un id de periodo');
      return;
    }



    this.expenseService
      .getByPeriod(Number(this.periodId))
      .pipe(
        tap(() => {

        }),
        switchMap(() => {

          return this.expenseService.getExpenses(
            this.currentPage - 1,
            this.size,
            Number(this.periodId),
            this.lote || undefined,
            this.type
          );
        })
      )
      .subscribe(
        (data) => {
          this.listExpenses = data.content.map((expense) => {
            const expenses = this.keysToCamel(expense) as Expense;
            return { ...expenses };
          });
          this.cantPages = data.totalElements;
        },
        (error) => {

          this.toastService.sendError('Error al cargar la listado de gastos');
        }
      );
  }

  toCamel(s: string) {
    return s.replace(/([-_][a-z])/gi, ($1) => {
      return $1.toUpperCase().replace('-', '').replace('_', '');
    });
  }

  keysToCamel(o: any): any {
    if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
      const n: { [key: string]: any } = {};
      Object.keys(o).forEach((k) => {
        n[this.toCamel(k)] = this.keysToCamel(o[k]);
      });
      return n;
    } else if (Array.isArray(o)) {
      return o.map((i) => {
        return this.keysToCamel(i);
      });
    }
    return o;
  }

  loadId() {
    this.periodId = this.route.snapshot.paramMap.get('period_id');

  }
  changeIndex($event: number) {
    this.currentPage = $event;
    this.loadList();
  }
}
