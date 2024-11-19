import {AfterViewInit, Component, inject, OnInit, TemplateRef, ViewChild} from '@angular/core';
import Category from "../../../models/category";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgPipesModule} from "ngx-pipes";
import {CategoryService} from "../../../services/category.service";
import {NewCategoryModalComponent} from "../../modals/bills/new-category-modal/new-category-modal.component";
import {
  NgbDropdownModule,
  NgbModal
} from "@ng-bootstrap/ng-bootstrap";
import {EditCategoryModalComponent} from "../../modals/bills/edit-category-modal/edit-category-modal.component";
import {DeleteCategoryModalComponent} from "../../modals/bills/delete-category-modal/delete-category-modal.component";
import {CategoryBillInfoComponent} from "../../modals/info/category-bill-info/category-bill-info.component";
import {
  Filter, FilterConfigBuilder,
  MainContainerComponent,
  TableColumn,
  TableComponent,
  ToastService
} from "ngx-dabd-grupo01";
import { CommonModule, DatePipe} from "@angular/common";
import * as XLSX from 'xlsx';
import moment from "moment/moment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {map} from 'rxjs';

@Component({
  selector: 'app-expenses-category-bill',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgPipesModule,
    MainContainerComponent,
    TableComponent,
    CommonModule,
    NgbDropdownModule
  ],
  providers: [DatePipe],
  templateUrl: './expenses-category-bill.component.html',
  styleUrl: './expenses-category-bill.component.css'
})
export class ExpensesCategoryBillComponent implements OnInit, AfterViewInit {

  // SERVICES
  private toastService = inject(ToastService);
  private categoryService = inject(CategoryService);
  private modalService = inject(NgbModal);

  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // PAGINATION PROPERTIES
  totalItems = 0;
  page = 1;
  size = 10;
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  searchParams: { [key: string]: any } = {};

  // TABLE PROPERTIES
  searchTerm = '';
  isLoading = false;
  categories: Category[] = [];
  columns: TableColumn[] = [];
  fileName: string = 'reporte-categorias-gastos';
  filterConfig: Filter[] = new FilterConfigBuilder()
    .selectFilter(
      'Estado',
      'isDeleted',
      'Seleccione el Estado',
      [
        {value: "" , label: "Todas"},
        {value: 'false', label: 'Activas'},
        {value: 'true', label: 'Inactivas'}
      ]
    ).build()

  onFilterValueChange(filters: Record<string, any>) {
    this.searchParams = {
      ...filters
    };

    this.page = 1;
    this.loadCategories();
  }

  // Handlers for pagination
  onPageChange = (page: number) => {
    this.page = (page);
    this.loadCategories();
  };

  onPageSizeChange = (size: number) => {
    this.size = size;
    this.page = 1;
    this.loadCategories();
  };

  ngOnInit(): void {
    this.searchParams = { 'isDeleted':'false' };
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    setTimeout(()=>{
      this.columns = [
        { headerName: 'Nombre', accessorKey: 'name' },
        { headerName: 'Descripción', accessorKey: 'description' },
        {
          headerName: 'Estado',
          accessorKey: 'is_delete',
          cellRenderer: this.statusTemplate,
        },
        {
          headerName: 'Acciones',
          accessorKey: 'actions',
          cellRenderer: this.actionsTemplate
        }
      ];
    })
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getPaginatedCategories(
      this.page -1,
      this.size,
      this.sortField,
      this.sortDirection,
      this.searchParams
    ).subscribe({
      next: (response) => {
        this.categories = response.content
        this.totalItems = response.totalElements;
      },
      error: (error) => {
        this.toastService.sendError('Error al cargar categorías');
        this.categories = [];
        this.totalItems = 0;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onSearchValueChange(searchTerm: string) {
    this.searchParams['searchTerm'] = searchTerm;
    this.page = 0;
    this.loadCategories();
  }

  openFormModal() {
    const modalRef = this.modalService.open(NewCategoryModalComponent);
    modalRef.result.then(
      (result) => {
        if (result.success) {
          this.toastService.sendSuccess(result.message)
          this.loadCategories();
        } else {
          this.toastService.sendError(result.message)
        }
      }
    );
  }

  deleteCategory(category: Category) {
    const modalRef = this.modalService.open(DeleteCategoryModalComponent, {
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.category = category;
    modalRef.result.then(
      (result) => {
        if (result.success) {
          this.toastService.sendSuccess(result.message)
          window.location.reload();
        } else {
          this.toastService.sendError(result.message)
        }
      }
    );
  }

  editCategory(category: Category) {
    const modalRef = this.modalService.open(EditCategoryModalComponent);
    modalRef.componentInstance.category = category;
    modalRef.result.then(
      (result) => {
        if (result.success) {
          this.toastService.sendSuccess(result.message)
          this.loadCategories();
        } else {
          this.toastService.sendError(result.message)
        }
      }
    );
  }

  showInfo(): void {
    this.modalService.open(CategoryBillInfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true
    });
  }

  downloadTable() {
    return this.categoryService.getPaginatedCategories(
      0,
      this.totalItems,
      this.sortField,
      this.sortDirection,
      this.searchParams
    ).pipe(
      map((response) => {
          // Mapear los datos a un formato tabular adecuado
          const data = response.content.map(category => ({
            'Nombre': category.name,
            'Descripcion': category.description
          }));
          const fecha = new Date();
          const finalName = this.fileName + '-' + moment(fecha).format("DD-MM-YYYY_HH-mm");
          const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Categorias de Gastos');
          XLSX.writeFile(wb, `${finalName}.xlsx`);
          return response.content;
        }
      )
    )
  }

  imprimirPDF() {
    let doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Categorias de Gastos', 14, 20);
    this.categoryService.getPaginatedCategories(0,this.totalItems,this.sortField,this.sortDirection,this.searchParams)
      .subscribe(categories => {
        // Usando autoTable para agregar la tabla
        autoTable(doc, {
          startY: 30,
          head: [['Nombre', 'Descripcion']],
          body: categories.content.map(category => [
            category.name,
            category.description
            ]
          ),
        });
        // Guardar el PDF después de agregar la tabla
        const fecha = new Date();
        const finalFileName = this.fileName + "-" + moment(fecha).format("DD-MM-YYYY_HH-mm") +".pdf";
        doc.save(finalFileName);
      });

  }

}
