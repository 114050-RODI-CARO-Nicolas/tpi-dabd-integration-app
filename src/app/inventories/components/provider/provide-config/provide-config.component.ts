import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmAlertComponent, Filter, FilterConfigBuilder, MainContainerComponent, TableFiltersComponent, ToastService } from 'ngx-dabd-grupo01';
import { ProviderTypeUpdateComponent } from "../provider-type-update/provider-type-update.component";
import { CompanyService } from '../../../services/suppliers/company.service';
import { Company } from '../../../models/suppliers/company.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-provide-config',
  standalone: true,
  imports: [MainContainerComponent, ReactiveFormsModule, ProviderTypeUpdateComponent, TableFiltersComponent],
  providers: [DatePipe],
  templateUrl: './provide-config.component.html',
  styleUrl: './provide-config.component.css'
})
export class ProvideConfigComponent implements OnInit {
  filterForm = new FormGroup({
    name: new FormControl(''),
    enabled: new FormControl('')
  });

  searchFilter = new FormControl('');
  originalCompanies: Company[] = []; 

  showModalFilter: boolean = false;
  showServiceTypeUpdate: boolean = false;
  companies: Company[] = [];
  selectedCompany: Company | null = null;

  private modalService = inject(NgbModal);
  private companyService = inject(CompanyService);
  private toastService = inject(ToastService);
  currentFilters! : Record<string,any>;

  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  filterConfig: Filter[] = new FilterConfigBuilder()
    .selectFilter(
      'Estado',
      'enabled',
      'Seleccione un Tipo',
      [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Activo' },
        { value: 'false', label: 'Inactivo' }
      ]
    ).build();

  ngOnInit(): void {
    this.loadCompanies();
    this.setupSearchFilter();  // Nuevo método para configurar el filtro
  }

  private setupSearchFilter(): void {
    this.searchFilter.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.filterCompanies(searchTerm || '');
      });
  }

  filterChange($event: Record<string, any>) {
    const filters = $event;
    this.currentFilters = filters;
    this.loadCompanies();
  }
  private filterCompanies(searchTerm: string): void {
    if (!searchTerm) {
      this.companies = [...this.originalCompanies];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.companies = this.originalCompanies.filter(company => 
      company.name.toLowerCase().includes(term)
    );
  }

  loadCompanies() {
    this.companyService.getCompanies().subscribe({
      next: (response) => {
        this.originalCompanies = response;  // Guardar copia original
        this.companies = [...this.originalCompanies];  // Inicializar lista mostrada
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      }
    });
  }

    // Agregar este método
    openModalFilter(): void {
      this.showModalFilter = true;
    }
  
    closeModalFilter(): void {
      this.showModalFilter = false;
    }

  applyFilters() {
    // Implementar filtrado basado en this.filterForm.value
    const filters = this.filterForm.value;
    this.loadCompanies(); // Recargar y luego filtrar localmente
    
    if (filters.name) {
      this.companies = this.companies.filter(company => 
        company.name.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }
    
    if (filters.enabled !== null && filters.enabled !== '') {
      this.companies = this.companies.filter(company => 
        company.enabled === (filters.enabled === 'true')
      );
    }
    
    this.closeModalFilter();
  }

  filterByStatus(status: string) {
    if (status === 'all') {
      this.loadCompanies();
    } else {
      const isEnabled = status === 'active';
      this.companies = this.companies.filter(company => company.enabled === isEnabled);
    }
  }

  onCompanyUpdate(company?: Company | null) {
    this.selectedCompany = company || null;
    this.showServiceTypeUpdate = true;
  }

  deleteCompany(id: number) {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = '¿Está seguro que desea eliminar esta compañía?';
    modalRef.componentInstance.alertVariant = 'delete';
    
    modalRef.result.then((result) => {
      if (result){
        this.companyService.deleteCompany(id).subscribe({
          next: () => {
            this.toastService.sendSuccess('Compañía eliminada exitosamente');
            this.loadCompanies();
          },
          error: (error) => {
            this.toastService.sendError('Error al eliminar la compañía');
            console.error('Error deleting company:', error);
        }
      });
      }
    })
  }

  clearFilters() {
    this.filterForm.reset();
    this.loadCompanies();
  }

  onServiceTypeUpdateClose() {
    this.showServiceTypeUpdate = false;
    this.selectedCompany = null;
    this.loadCompanies();
  }

  showInfo() {
    this.modalService.open(this.infoModal, { centered: true });
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Nombre', 'Estado']],
      body: this.companies.map(company => [
        company.name,
        company.enabled ? 'Activo' : 'Inactivo'
      ])
    });
    doc.save('companias.pdf');
  }

  exportToExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.companies.map(company => ({
      Nombre: company.name,
      Estado: company.enabled ? 'Activo' : 'Inactivo'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Compañías');
    XLSX.writeFile(workbook, 'companias.xlsx');
  }
}