import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Bill } from '../../../../models/bill';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProviderService } from '../../../../services/provider.service';
import { CategoryService } from '../../../../services/category.service';
import { PeriodService } from '../../../../services/period.service';
import Category from '../../../../models/category';
import Period from '../../../../models/period';
import { BillService } from '../../../../services/bill.service';
import BillType from '../../../../models/billType';
import { Provider } from '../../../../models/provider';
import { CommonModule } from '@angular/common';
import { NgModalComponent } from '../../ng-modal/ng-modal.component';
import { ToastService } from 'ngx-dabd-grupo01';
import { NgSelectComponent } from '@ng-select/ng-select';
import { map } from 'rxjs';
import { NewCategoryModalComponent } from '../../bills/new-category-modal/new-category-modal.component';
import { StorageService } from '../../../../services/storage.service';
import { User } from '../../../../models/user';

@Component({
  selector: 'app-edit-bill-modal',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgSelectComponent,
  ],
  templateUrl: './edit-bill-modal.component.html',
  styleUrl: './edit-bill-modal.component.css'
})
export class EditBillModalComponent implements OnInit {
  private activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder); // Usamos FormBuilder en lugar de new FormGroup
  private supplierService = inject(ProviderService);
  private categoryService = inject(CategoryService);
  private periodService = inject(PeriodService);
  private billService = inject(BillService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private strageService = inject(StorageService);

  newCategoryForm: FormGroup;
  @ViewChild('newCategoryModal') newCategoryModal: any;

  @Input() bill?: Bill;
  updateBill: FormGroup;

  suppliersList: Provider[] = [];
  categoriesList: Category[] = [];
  periodsList: Period[] = [];
  billTypesList: BillType[] = [];

  constructor() {
    // Inicializamos el Formulario usando FormBuilder
    this.updateBill = this.fb.group({
      expenditureId: [''],
      date: [null, {
        validators: Validators.required,
        asyncValidators: this.dateValidator.bind(this),
      }],
      amount: [null, Validators.required],
      description: [''],
      supplier: [null, Validators.required],
      period: [null, Validators.required],
      category: [null, Validators.required],
      billType: [null, Validators.required],
      status: ['']
    });

    this.newCategoryForm = this.fb.group({
      name: [''],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadLists();
    this.updateBill.patchValue({
      expenditureId: this.bill?.expenditureId,
      date: this.formatDate(this.bill?.date),
      amount: this.bill?.amount,
      description: this.bill?.description,
      supplier: this.bill?.supplier.id,
      period: this.bill?.period.id,
      category: this.bill?.category.category_id,
      billType: this.bill?.billType.bill_type_id,
      status: this.bill?.status
    });
  }

  async loadLists() {
    try {
      this.categoryService.getAllCategories().subscribe((categories) => {
        this.categoriesList = this.sortCategoriesAlphabetically(categories);
      });
      this.supplierService.getAllProviders().subscribe((suppliers) => {
        this.suppliersList = this.sortSuppliersAlphabetically(suppliers);
      });
      this.periodService.get().subscribe((periods) => {
        this.periodsList = periods.map(period => ({
          ...period,
          displayPeriod: `${period.month}/${period.year}`
        }));
      });
      this.updateBill.patchValue({
        period: this.bill?.period.id,
      });
      this.billService.getBillTypes().subscribe((types) => {
        this.billTypesList = this.sortBillTypeAlphabetically(types);
      });
    } catch (error) {
      this.toastService.sendError('Error al cargar las listas');
    }
  }

  comparePeriodFn(period1: any, period2: any) {
    return period1 && period2 ? period1.id === period2.id : period1 === period2;
  }

  formatPeriod(date: string): string {
    const d = new Date(date);
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return `${month} ${year}`;
  }

  sortSuppliersAlphabetically(suppliers: Provider[]): Provider[] {
    return suppliers.sort((a, b) => a.name.localeCompare(b.name));
  }

  sortCategoriesAlphabetically(categories: Category[]): Category[] {
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  sortBillTypeAlphabetically(billType: BillType[]): BillType[] {
    return billType.sort((a, b) => a.name.localeCompare(b.name));
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  dateValidator(control: AbstractControl): ReturnType<AsyncValidatorFn> {
    if (!control.value) {
      return Promise.resolve(null);
    }
    const periodId = this.updateBill?.get('period')?.value;

    if (!periodId) {
      return Promise.resolve(null);
    }
    const numericPeriodId = parseInt(periodId?.toString().split('/')[0]);

    return this.billService.validateDate(control.value, numericPeriodId).pipe(
      map(isValid => {
        return !isValid ? { invalidDate: true } : null;
      })
    );
  }

  onSubmit() {
    let user = this.strageService.getFromSessionStorage('user') as User;

    if (this.updateBill.valid) {
      const requestBill = {
        description: this.updateBill.value.description,
        amount: this.updateBill.value.amount,
        date: new Date(this.updateBill.value.date).toISOString(),
        status: this.bill?.status,
        category_id: this.updateBill.value.category,
        supplier_id: this.updateBill.value.supplier,
        supplier_employee_type: 'SUPPLIER',
        type_id: this.updateBill.value.billType,
        period_id: this.updateBill.value.period,
        link_pdf: 'string'
      };

      this.billService.updateBill(requestBill, this.bill?.expenditureId, user.value.id).subscribe({
        next: (response: any) => {
          this.toastService.sendSuccess('El gasto se ha actualizado correctamente.');
          this.activeModal.close('updated');
        },
        error: (error: any) => {
          this.toastService.sendError('Ha ocurrido un error al actualizar el gasto. Por favor, inténtelo de nuevo.');
        },
      });
    }
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  openNewCategoryModal() {
    const modalRef = this.modalService.open(NewCategoryModalComponent, {
      ariaLabelledBy: 'modal-basic-title',
    });

    modalRef.result.then((result) => {
      if (result) {
        if (result.success) {
          this.toastService.sendSuccess(result.message);
        } else {
          this.toastService.sendError(result.message);
        }
      }
    });
  }

  resetForm() {
    this.loadLists();
  }

  showModal(title: string, message: string) {
    const modalRef = this.modalService.open(NgModalComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
  }

  saveNewCategory() {
    if (this.newCategoryForm.valid) {
      let newCategory: Category = this.newCategoryForm.value;
      newCategory.name = newCategory.name?.trim();
      newCategory.description = newCategory.description?.trim();
      newCategory.is_delete = false;

      this.categoryService.addCategory(newCategory).subscribe({
        next: (response: any) => {
          this.toastService.sendSuccess('La categoria se ha añadido correctamente')
          this.resetForm();
        },
        error: (error: any) => {
          if (error.status === 409) {
            this.toastService.sendError('Ya existe una categoría con este nombre. Por favor, elija un nombre diferente');
          } else {
            this.toastService.sendError('Ha ocurrido un error al añadir la categoría. Por favor, inténtelo de nuevo');
          }
        },
      });
    } else {
      this.toastService.sendError('Por favor, complete todos los campos requeridos correctamente');
    }
    this.modalService.dismissAll();
    this.newCategoryForm.reset();
  }
}
