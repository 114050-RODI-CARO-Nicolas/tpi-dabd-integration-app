import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BillPostRequest } from '../../../models/bill-post-request';
import { Observable, map, of, switchMap } from 'rxjs';
import Category from '../../../models/category';
import Period from '../../../models/period';
import { Provider } from '../../../models/provider';
import { CategoryService } from '../../../services/category.service';
import { ProviderService } from '../../../services/provider.service';
import { PeriodService } from '../../../services/period.service';
import { BillService } from '../../../services/bill.service';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import BillType from '../../../models/billType';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { BillInfoComponent } from '../../modals/info/bill-info/bill-info.component';
import { NewCategoryModalComponent } from '../../modals/bills/new-category-modal/new-category-modal.component';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { NgArrayPipesModule } from 'ngx-pipes';
import { NgSelectComponent } from '@ng-select/ng-select';
import {SessionService} from '../../../../users/services/session.service';

@Component({
  selector: 'app-expenses-add-bill',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    NgClass,
    NgArrayPipesModule,
    MainContainerComponent,
    NgSelectComponent,
  ],
  templateUrl: './expenses-add-bill.component.html',
  styleUrl: './expenses-add-bill.component.css',
  providers: [DatePipe],
})
export class ExpensesAddBillComponent implements OnInit {

  //#region Dependencies
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private providerService = inject(ProviderService);
  private periodService = inject(PeriodService);
  private billService = inject(BillService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private readonly sessionService = inject(SessionService)
  //#endregion

  //#region Form Groups and ViewChild
  billForm: FormGroup;
  newCategoryForm: FormGroup;
  @ViewChild('newCategoryModal') newCategoryModal: any;
  //#endregion

  //#region Properties
  searchTerm: any;
  periodId: number = 0;
  categories: Observable<Category[]> | undefined;
  providers: Observable<Provider[]> | undefined;
  periods: Observable<Period[]> | undefined;
  types: Observable<BillType[]> | undefined;
  userID: number;
  //#endregion

  constructor() {
    this.userID = Number(this.sessionService.getItem('user').id);
    //#region Initialize Forms
    this.billForm = this.fb.group({
      categoryId: ['', Validators.required],
      description: [''],
      amount: ['', [Validators.required, Validators.min(0.0001)]],
      date: [
        '',
        [Validators.required],
        [(control) => this.dateValidator(control)],
      ],
      supplierId: ['', [Validators.required]],
      typeId: ['', [Validators.required]],
      periodId: ['', [Validators.required]],
    });

    this.newCategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.billForm.get('period')?.valueChanges.subscribe(() => {
      this.billForm.get('date')?.updateValueAndValidity();
    });
    //#endregion
  }

  //#region Lifecycle Hooks
  ngOnInit() {
    this.loadSelectOptions();
    this.periods = this.periods?.pipe(
      map((periods) =>
        periods.map((period) => ({
          ...period,
          displayPeriod: `${period.month}/${period.year}`,
        }))
      )
    );
  }
  //#endregion

  //#region Validators
  dateValidator(control: AbstractControl): ReturnType<AsyncValidatorFn> {
    if (!control.value) return Promise.resolve(null);

    const periodId = this.billForm?.get('periodId')?.value;
    if (!periodId) return Promise.resolve(null);

    const numericPeriodId = parseInt(periodId?.toString().split('/')[0]);
    return this.billService
      .validateDate(control.value, numericPeriodId)
      .pipe(map((isValid) => (!isValid ? { invalidDate: true } : null)));
  }
  //#endregion

  //#region Data Loading
  loadSelectOptions() {
    this.categories = this.categoryService.getAllCategories();
    this.providers = this.providerService.getAllProviders();
    this.periods = this.periodService.getOpenPeriods();
    this.types = this.billService.getBillTypes();
  }
  //#endregion

  //#region Utility Functions
  comparePeriodFn(period1: any, period2: any) {
    return period1 && period2 ? period1.id === period2.id : period1 === period2;
  }
  //#endregion

  //#region Form Submission
  onSubmit() {
    if (this.billForm.valid) {
      of(this.billForm.value)
        .pipe(
          map((formValue) => {
            const billRequest = new BillPostRequest();
            billRequest.categoryId = Number(formValue.categoryId);
            billRequest.description = formValue.description;
            billRequest.amount = Number(formValue.amount);
            billRequest.date = `${formValue.date}T00:00:00Z`;
            billRequest.supplierId = Number(formValue.supplierId);
            billRequest.supplierEmployeeType = 'SUPPLIER';
            billRequest.typeId = Number(formValue.typeId);
            billRequest.periodId = Number(formValue.periodId);
            billRequest.linkPdf = '';
            return billRequest;
          }),
          switchMap((billRequest) => this.billService.addBill(billRequest, this.userID))
        )
        .subscribe({
          next: (response: any) => {
            this.toastService.sendSuccess(
              'El gasto se ha añadido correctamente.'
            );
            this.router.navigate([`expenses/gastos`]);
          },
          error: (error: any) => {
            if (error.status === 409) {
              this.toastService.sendError(
                'Datos incorrectos/inexistentes. Por favor, intentelo de nuevo.'
              );
            } else {
              this.toastService.sendError(error.error.message);
            }
          },
        });
    } else {
      this.toastService.sendError(
        'Por favor, complete todos los campos requeridos correctamente.'
      );
    }
  }
  //#endregion

  //#region Form Utilities
  onBack() {
    this.router.navigate([`expenses/gastos`]);
  }
  //#endregion

  //#region Modal Handling
  openNewCategoryModal() {
    const modalRef = this.modalService.open(NewCategoryModalComponent, {
      ariaLabelledBy: 'modal-basic-title',
    });

    modalRef.result.then((result) => {
      if (result) {
        if (result.success) {
          this.toastService.sendSuccess(result.message);
          this.loadSelectOptions();
        } else {
          this.toastService.sendError(result.message);
        }
      }
    });
  }

  showInfo(): void {
    this.modalService.open(BillInfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });
  }
  //#endregion
}
