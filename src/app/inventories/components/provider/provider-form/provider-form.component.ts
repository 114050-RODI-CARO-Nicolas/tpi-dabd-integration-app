import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ProvidersService } from '../../../services/providers.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Supplier } from '../../../models/suppliers/supplier.model';
import { Service } from '../../../models/suppliers/service.model';
import { Company } from '../../../models/suppliers/company.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService, MainContainerComponent } from 'ngx-dabd-grupo01';
import { cuilValidator } from '../../validators/cuil.validator';

@Component({
  selector: 'app-provider-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MainContainerComponent],
  templateUrl: './provider-form.component.html',
  styleUrl: './provider-form.component.css'
})
export class ProviderFormComponent implements OnInit {
  providerForm: FormGroup;
  isEditMode = false;
  currentProviderId: number | null = null;
  services: Service[] = [];
  companies: Company[] = [];

  private providerService = inject(ProvidersService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);

  constructor() {
    // this.providerForm = this.fb.group({
    //   name: ['', Validators.required],
    //   cuil: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    //   service: [null, Validators.required],
    //   company: [null, Validators.required],
    //   contact: ['', Validators.required],
    //   address: ['', Validators.required],
    //   details: ['', Validators.required]
    // });
    this.providerForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.&-]*$/)
      ]],
      cuil: ['', [
        Validators.required,
        Validators.pattern(/^\d{11}$/),
        cuilValidator()
      ]],
      service: [null, [
        Validators.required
      ]],
      company: [null, [
        Validators.required
      ]],
      contact: ['', [
        Validators.required,
        Validators.minLength(8),
        (control: AbstractControl) => {
          if (!control.value) return null;
          const value = control.value.toString();
          
          // Detectar si es email o teléfono
          if (value.includes('@')) {
            return this.emailValidator()(control);
          } else {
            return this.phoneValidator()(control);
          }
        }
      ]],
      address: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200),
        Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,.-]*$/)
      ]],
      details: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]]
    });
  }

  ngOnInit(): void {
    this.loadServices();
    this.loadCompanies();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.currentProviderId = +id;
        this.loadProviderData(this.currentProviderId);
      }
    });
  }

  loadServices(): void {
    this.providerService.getServices().subscribe({
      next: (services) => {
        this.services = services;
      },
      error: (error) => {
        this.toastService.sendError('Error al cargar los servicios');
      }
    });
  }

  loadCompanies(): void {
    this.providerService.getCompany().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: (error) => {
        this.toastService.sendError('Error al cargar las compañías');
      }
    });
  }

  onSubmit(): void {
    if (this.providerForm.valid) {
      const formData = this.prepareFormData();
      
      if (this.isEditMode && this.currentProviderId !== null) {
        this.updateProvider(formData);
      } else {
        this.addProvider(formData);
      }
    } else {
      this.markFormGroupTouched(this.providerForm);
    }
  }

  prepareFormData(): any {
    const formValue = this.providerForm.value;
    
    // Preparar el DTO para el envío
    const formData: {
      id?: number;
      name: string;
      details: string;
      cuil: string;
      company: number;
      service: number;
      contact: string;
      address: string;
    } = {
      name: formValue.name,
      details: formValue.details,
      cuil: formValue.cuil,
      company: formValue.company,
      service: formValue.service,
      contact: formValue.contact,
      address: formValue.address
    };

    if (this.isEditMode && this.currentProviderId) {
      formData.id = this.currentProviderId;
    }

    return formData;
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  addProvider(providerData: any): void {
    this.providerService.addProvider(providerData).subscribe({
      next: (response) => {
        this.toastService.sendSuccess("El proveedor ha sido creado con éxito.");
        this.resetForm();
        this.router.navigate(['/inventories/providers/list']);
      },
      error: (error) => {
        this.toastService.sendError("Hubo un error en la creación del proveedor.");
      }
    });
  }

  showInfo(): void {
    this.modalService.open(this.infoModal, { centered: true });
  }
  
  updateProvider(providerData: any): void {
    this.providerService.updateProvider(providerData).subscribe({
      next: (response) => {
        this.toastService.sendSuccess("El proveedor ha sido modificado con éxito.");
        this.resetForm();
        this.router.navigate(['/inventories/providers/list']);
      },
      error: (error) => {
        this.toastService.sendError("Hubo un error en la modificación del proveedor.");
      }
    });
  }

  resetForm() {
    this.providerForm.reset();
    this.isEditMode = false;
    this.currentProviderId = null;
    this.router.navigate(['/inventories/providers/list']);
  }

  loadProviderData(id: number): void {
    this.providerService.getProviderById(id).subscribe({
      next: (provider: Supplier) => {
        this.currentProviderId = provider.id;
        this.providerForm.patchValue({
          name: provider.name,
          cuil: provider.cuil,
          service: provider.service?.id,
          company: provider.company?.id,
          contact: provider.contact,
          address: provider.address,
          details: provider.details
        });
      },
      error: (error) => {
        this.toastService.sendError('No se pudo cargar los datos del proveedor');
      }
    });
  }

  private cuilValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      
      const cuil = control.value.toString().replace(/\D/g, '');
      
      if (cuil.length !== 11) {
        return { invalidLength: 'El CUIL debe tener 11 dígitos' };
      }

      const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;

      for (let i = 0; i < multiplicadores.length; i++) {
        suma += parseInt(cuil[i]) * multiplicadores[i];
      }

      const resto = suma % 11;
      const digitoVerificador = 11 - resto;
      const ultimoDigito = parseInt(cuil[10]);

      if (digitoVerificador !== ultimoDigito) {
        return { invalidCheckDigit: 'Dígito verificador inválido' };
      }

      return null;
    };
  }
  private phoneValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const phone = control.value.toString();
      const phoneRegex = /^[\d\s()-]{8,15}$/;
      return phoneRegex.test(phone) ? null : { invalidPhone: true };
    };
  }

  private emailValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const email = control.value.toString();
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      return emailRegex.test(email) ? null : { invalidEmail: true };
    };
  }

  getErrorMessage(controlName: string): string {
    const control = this.providerForm.get(controlName);
    
    if (control?.errors) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
      if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      if (control.errors['pattern']) {
        switch (controlName) {
          case 'name':
            return 'Solo se permiten letras, espacios y algunos caracteres especiales (. & -)';
          case 'cuil':
            return 'El CUIL debe contener solo números';
          case 'address':
            return 'Formato de dirección inválido';
          default:
            return 'Formato inválido';
        }
      }
      if (control.errors['invalidLength']) return 'El CUIL debe tener 11 dígitos';
      if (control.errors['invalidCheckDigit']) return 'CUIL inválido';
      if (control.errors['invalidEmail']) return 'Email inválido';
      if (control.errors['invalidPhone']) return 'Teléfono inválido';
    }
    return '';
  }

  // Método para verificar si un campo es inválido
  isFieldInvalid(fieldName: string): boolean {
    const field = this.providerForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }
}