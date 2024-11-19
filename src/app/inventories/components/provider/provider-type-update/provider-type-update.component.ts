import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Company } from '../../../models/suppliers/company.model';
import { CompanyService } from '../../../services/suppliers/company.service';
import { ToastService } from 'ngx-dabd-grupo01';

@Component({
  selector: 'app-provider-type-update',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './provider-type-update.component.html',
  styleUrl: './provider-type-update.component.css'
})
export class ProviderTypeUpdateComponent implements OnInit {
  @Input() company: Company | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() showServiceTypeUpdate = new EventEmitter<void>();

  isModalOpen: boolean = true;
  companyForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    enabled: new FormControl(true)
  });

  private toastService = inject(ToastService);

  constructor(private companyService: CompanyService) {}

  ngOnInit(): void {
    if (this.company) {
      this.companyForm.patchValue({
        name: this.company.name,
        enabled: this.company.enabled
      });
    }
  }

  get nameControl() {
    return this.companyForm.get('name');
  }

  saveCompanyChanges() {
    if (this.companyForm.valid) {
      const companyData: Company = {
        id: this.company?.id ?? 0,
        name: this.companyForm.value.name ?? '',
        registration: this.company?.registration ?? new Date().toISOString().split('T')[0],
        enabled: this.companyForm.value.enabled ?? true
      };

      if (this.company) {
        // Update existing company
        this.companyService.updateCompany(companyData).subscribe({
          next: () => {
            this.toastService.sendSuccess('Compañia actualizada correctamente.');
            this.onClose();
          },
          error: (error) => {
            this.toastService.sendError('Error al actualizar la compañia.');
            console.error('Error updating company:', error);
          }
        });
      } else {
        // Create new company
        this.companyService.createCompany(companyData).subscribe({
          next: () => {
            this.toastService.sendSuccess('Compañia creada correctamente.');
            this.onClose();
          },
          error: (error) => {
            this.toastService.sendError('Error al crear la compañia.');
            console.error('Error creating company:', error);
          }
        });
      }
    }
  }

  onClose() {
    this.isModalOpen = false;
    this.closeModal.emit();
  }
}