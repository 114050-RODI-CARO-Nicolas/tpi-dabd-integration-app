import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LiquidationExpenseService } from '../../../services/liquidation-expense.service';
import { ExpensesModalComponent } from '../../modals/expenses-modal/expenses-modal.component';
import LiquidationExpense from '../../../models/liquidationExpense';
import { NgModalComponent } from '../../modals/ng-modal/ng-modal.component';
import { InfoModalComponent } from '../../modals/info-modal/info-modal.component';
import { FormsModule } from '@angular/forms';
import { NgPipesModule } from 'ngx-pipes';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';
import { ToastService } from 'ngx-dabd-grupo01';

@Component({
  selector: 'app-expenses-liquidation-expenses-list',
  standalone: true,
  imports: [
    CommonModule,
    ExpensesModalComponent,
    InfoModalComponent,
    FormsModule,
    NgPipesModule,
  ],
  templateUrl: './expenses-liquidation.component.html',
  styleUrl: './expenses-liquidation.component.css',
})
export class ExpensesLiquidationComponent implements OnInit {
  liquidationExpensesService: LiquidationExpenseService = inject(
    LiquidationExpenseService
  );

  private readonly location = inject(Location);
  private modalService = inject(NgbModal);


  toastService: ToastService = inject(ToastService);

  items: any[] = [];
  sizeOptions: number[] = [];
  type: string = 'Ordinarias';
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  liquidationExpensesList: LiquidationExpense[] = [];
  id: number | null = null;
  selectedItemId: number | null = null;
  isModalVisible = false;
  selectedPeriodId: number | null = null;


  searchTerm = '';

  fileName = 'reporte-liquidaciones-expensas'

  listLooking: LiquidationExpense[] = [];

  open(content: TemplateRef<any>, id: number | null) {
    this.selectedItemId = id;
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  changeStateQuery(text: string) {
    this.type = text;
    this.loadLookList();
  }

  loadLookList() {
    this.listLooking = this.liquidationExpensesList.filter(
      (liq) => liq.bill_type?.name === this.type
    );
  }

  ngOnInit(): void {
    this.loadId();
    this.loadList(this.id);
    this.loadList(this.id);
  }

  private loadId(): void {
    this.route.paramMap.subscribe((params) => {
      this.id = Number(params.get('period_id'));
    });
  }

  private loadList(id: number | null) {
    if (id) {
      this.liquidationExpensesService
        .get(id)
        .subscribe((data: LiquidationExpense[]) => {
          this.liquidationExpensesList = data;
          this.loadLookList();
        });
    }
  }

  closeLiquidation() {
    if (this.listLooking[0].expense_id) {
      this.liquidationExpensesService
        .putCloseLiquidationExpensesPeriod(this.listLooking[0].period?.id || 0)
        .subscribe({
          next: () => {
            this.loadList(this.id);
            this.toastService.sendSuccess('ESe cerro la liquidación');

          },
        });
    }
  }

  closeLiquidationPeriod() {
    if (this.selectedItemId) {
      this.liquidationExpensesService
        .putCloseLiquidationExpensesPeriod(this.selectedItemId)
        .subscribe({
          next: () => {
            this.loadList(this.id);
            this.toastService.sendSuccess('Se cerro la liquidación');
          },
          error: (err) => {
            this.toastService.sendError('Error al cerrar una liquidación');
          },
        });
      this.selectedItemId = null;
    }
  }

  seeDetail(categoryId: number) {
    let id = this.listLooking[0].expense_id;

    this.router.navigate([`expenses/expense/periodo/${this.id}/liquidacion/${id}/${categoryId}`]);
  }

  openErrorModal(err: any) {
    const modalRef = this.modalService.open(NgModalComponent);
    modalRef.componentInstance.title = 'Error';
    modalRef.componentInstance.message = err?.error.message;
  }

  showModal(content: TemplateRef<any>) {
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  goBack() {
    this.location.back();
  }

  imprimir() {

    const doc = new jsPDF();


    doc.setFontSize(18);
    doc.text('Reposrte de Liquidación de Expensas', 14, 20);

    if (this.id) {
      this.liquidationExpensesService
        .get(this.id)
        .subscribe((data: LiquidationExpense[]) => {
          const doc = new jsPDF();


          doc.setFontSize(18);
          doc.text('Reposrte de Liquidación de Expensas', 14, 20);


          autoTable(doc, {
            startY: 30,
            head: [['Categoria', 'Tipo', 'Cantidad', 'Monto']],
            body: data.flatMap((liquidation) =>
              liquidation.liquidation_expenses_details.map(
                (liquidationExpense) => [
                  liquidationExpense.category?.name || 'N/A',
                  liquidation.bill_type?.name || 'N/A',
                  liquidationExpense.quantity || 0,
                  liquidationExpense.amount || 0,
                ]
              )
            ),
          });
          const fecha = new Date();
          const finalFileName = this.fileName + "-" + moment(fecha).format("DD-MM-YYYY_HH-mm") + ".pdf";
          doc.save(finalFileName);

        });
    }
  }

  downloadTable() {
    const data = this.listLooking[0].liquidation_expenses_details.map(
      (liquidationExpense) => ({
        Categoria: `${liquidationExpense.category}`,
        Tipo: `${this.listLooking[0].bill_type?.name}`,
        Cantidad: `${liquidationExpense.quantity}`,
        Monto: `${liquidationExpense.amount}`,
      })
    );
    const fecha = new Date();
    const finalFileName = this.fileName + "-" + moment(fecha).format("DD-MM-YYYY_HH-mm");
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidación de Expensas');
    XLSX.writeFile(wb, `${finalFileName}.xlsx`);
  }
}
