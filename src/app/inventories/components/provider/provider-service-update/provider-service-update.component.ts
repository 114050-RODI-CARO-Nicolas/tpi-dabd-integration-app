import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Service } from '../../../models/suppliers/service.model';
import { ServiceService } from '../../../services/suppliers/service.service';
import { ToastService } from 'ngx-dabd-grupo01';

@Component({
  selector: 'app-provider-service-update',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './provider-service-update.component.html',
  styleUrl: './provider-service-update.component.css'
})
export class ProviderServiceUpdateComponent implements OnInit {
  @Input() service: Service | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() showServiceTypeUpdate = new EventEmitter<void>();

  isModalOpen: boolean = true;
  serviceForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    enabled: new FormControl(true)
  });

  private toastService = inject(ToastService);

  constructor(private serviceService: ServiceService) {}

  ngOnInit(): void {
    if (this.service) {
      this.serviceForm.patchValue({
        name: this.service.name,
        enabled: this.service.enabled
      });
    }
  }

  get nameControl() {
    return this.serviceForm.get('name');
  }

  saveServiceChanges() {
    if (this.serviceForm.valid) {
      const serviceData: Service = {
        id: this.service?.id ?? 0,
        name: this.serviceForm.value.name ?? '',
        enabled: this.serviceForm.value.enabled ?? true
      };

      if (this.service) {
        // Update existing service
        this.serviceService.updateService(serviceData).subscribe({
          next: () => {
            this.toastService.sendSuccess('Servicio actualizado correctamente.');
            this.onClose();
          },
          error: (error) => {
            console.error('Error updating service:', error);
          }
        });
      } else {
        // Create new service
        this.serviceService.createService(serviceData).subscribe({
          next: () => {
            this.toastService.sendSuccess('Servicio creado correctamente.');
            this.onClose();
          },
          error: (error) => {
            console.error('Error creating service:', error);
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