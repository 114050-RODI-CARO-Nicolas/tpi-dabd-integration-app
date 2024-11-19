import {Component, inject, OnInit} from '@angular/core';
import {ReportPeriodService} from "../../../services/report-period/report-period.service";
import {MainContainerComponent, TableFiltersComponent, ToastService} from "ngx-dabd-grupo01";
import {CurrencyPipe, NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-top-supliers',
  standalone: true,
  imports: [
    MainContainerComponent,
    TableFiltersComponent,
    CurrencyPipe
  ],
  templateUrl: './top-supliers.component.html',
  styleUrl: './top-supliers.component.css'
})
export class TopSupliersComponent implements OnInit{
  topSuppliers: any[] = [];
  filteredSuppliers: any[] = [];
  private reportPeriodService = inject(ReportPeriodService);
  private toastService = inject(ToastService);




  ngOnInit(): void {
    this.loadTopSuppliers();
  }

  loadTopSuppliers() {
    
    this.reportPeriodService.getReportPeriods([1, 2, 3]).subscribe({
      next: (data) => {
        this.processTopSuppliers(data);
      },
      error: (err) => {
        this.toastService.sendError('Error cargando los top proveedores');
      },
    });
  }

  processTopSuppliers(reportPeriod: any) {
    const suppliers = reportPeriod?.resume?.supplier_ordinary;

    if (suppliers && suppliers.length > 0) {
      suppliers.sort((a: any, b: any) => b.totalAmount - a.totalAmount);
      this.topSuppliers = suppliers.slice(0, 10);
      this.filteredSuppliers = [...this.topSuppliers];
    } else {
      this.topSuppliers = [];
      this.filteredSuppliers = [];
    }
  }

  onSearchChange(event: any) {
    const searchTerm = event.target.value.toLowerCase().trim();

    if (searchTerm) {
      this.filteredSuppliers = this.topSuppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredSuppliers = [...this.topSuppliers];
    }
  }

}
