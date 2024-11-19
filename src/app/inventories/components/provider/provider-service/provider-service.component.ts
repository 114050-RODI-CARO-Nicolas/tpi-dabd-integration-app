import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmAlertComponent, MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { ProviderServiceUpdateComponent } from "../provider-service-update/provider-service-update.component";
import { ServiceService } from '../../../services/suppliers/service.service';
import { Service } from '../../../models/suppliers/service.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-provider-service',
  standalone: true,
  imports: [MainContainerComponent, ReactiveFormsModule, ProviderServiceUpdateComponent],
  templateUrl: './provider-service.component.html',
  styleUrl: './provider-service.component.css'
})
export class ProviderServiceComponent implements OnInit {
  filterForm = new FormGroup({
    name: new FormControl(''),
    enabled: new FormControl('')
  });

  searchFilter = new FormControl('');
  originalServices: Service[] = [];  // Nuevo array para datos originales
  showModalFilter: boolean = false;
  showServiceTypeUpdate: boolean = false;
  services: Service[] = [];
  selectedService: Service | null = null;

  private modalService = inject(NgbModal);
  private serviceService = inject(ServiceService);
  private toastService = inject(ToastService);

  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  ngOnInit(): void {
    this.loadServices();
    this.setupSearchFilter();  // Agregar configuración del filtro
  }

  private setupSearchFilter(): void {
    this.searchFilter.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.filterServices(searchTerm || '');
      });
  }

  private filterServices(searchTerm: string): void {
    if (!searchTerm) {
      this.services = [...this.originalServices];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.services = this.originalServices.filter(service => 
      service.name.toLowerCase().includes(term)
    );
  }

  loadServices() {
    this.serviceService.getServices().subscribe({
      next: (response) => {
        this.originalServices = response;  // Guardar copia original
        this.services = [...this.originalServices];  // Inicializar lista mostrada
      },
      error: (error) => {
        console.error('Error loading services:', error);
      }
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    this.loadServices(); // Recargar y luego filtrar localmente
    
    if (filters.name) {
      this.services = this.services.filter(service => 
        service.name.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }
    
    if (filters.enabled !== null && filters.enabled !== '') {
      this.services = this.services.filter(service => 
        service.enabled === (filters.enabled === 'true')
      );
    }
    
    this.closeModalFilter();
  }

  filterByStatus(status: string) {
    if (status === 'all') {
      this.loadServices();
    } else {
      const isEnabled = status === 'active';
      this.services = this.services.filter(service => service.enabled === isEnabled);
    }
  }

  onServiceUpdate(service?: Service | null) {
    this.selectedService = service || null;
    this.showServiceTypeUpdate = true;
  }

  deleteService(id: number) {
    const modalresult = this.modalService.open(ConfirmAlertComponent); 
    modalresult.componentInstance.alertTitle = 'Confirmación';
    modalresult.componentInstance.alertMessage = '¿Está seguro que desea eliminar este servicio?';
    modalresult.componentInstance.alertVariant = 'delete';

    modalresult.result.then((result) => {
      if(result){
        this.serviceService.deleteService(id).subscribe({
          next: () => {
            this.toastService.sendSuccess('Servicio eliminado exitosamente');
            this.loadServices();
          },
          error: (error) => {
            this.toastService.sendError('Error al eliminar el servicio');
            console.error('Error deleting service:', error);
          }
        });
      }
    })
  }

    openModalFilter(): void {
      this.showModalFilter = true;
    }

  closeModalFilter() {
    this.showModalFilter = false;
  }

  clearFilters() {
    this.filterForm.reset();
    this.loadServices();
  }

  onServiceTypeUpdateClose() {
    this.showServiceTypeUpdate = false;
    this.selectedService = null;
    this.loadServices();
  }

  showInfo() {
    this.modalService.open(this.infoModal, { centered: true });
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Nombre', 'Estado']],
      body: this.services.map(service => [
        service.name,
        service.enabled ? 'Activo' : 'Inactivo'
      ])
    });
    doc.save('servicios.pdf');
  }

  exportToExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.services.map(service => ({
      Nombre: service.name,
      Estado: service.enabled ? 'Activo' : 'Inactivo'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Servicios');
    XLSX.writeFile(workbook, 'servicios.xlsx');
  }
}