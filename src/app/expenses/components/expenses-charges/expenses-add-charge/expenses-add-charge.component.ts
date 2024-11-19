import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ChargeService } from '../../../services/charge.service';
import { CategoryCharge, Charge, ChargeType, Periods } from '../../../models/charge';
import Lot from '../../../models/lot';
import { PeriodService } from '../../../services/period.service';
import { LotsService } from '../../../services/lots.service';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { ChargeInfoComponent } from '../../modals/info/charge-info/charge-info.component';
import { NgSelectComponent } from '@ng-select/ng-select';
import { map } from 'rxjs';
import { NewCategoryChargeModalComponent } from '../../modals/charges/category/new-categoryCharge-modal/new-categoryCharge-modal.component';
import { StorageService } from '../../../services/storage.service';
import { URLTargetType } from '../../../../users/models/role';
import { User } from '../../../models/user';
@Component({
  selector: 'app-expenses-add-charge',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MainContainerComponent, NgSelectComponent ],
  templateUrl: './expenses-add-charge.component.html',
  styleUrl: './expenses-add-charge.component.css',
})
export class ExpensesAddChargeComponent implements OnInit{
  //VARIABLE DE USER
  user : User;
  rolCode: boolean= false;
  //chargeForm: FormGroup;
  private fb: FormBuilder = inject(FormBuilder);
  private chargeService = inject(ChargeService);
  private modalService = inject(NgbModal);
  private router = inject(Router);
  private storage = inject(StorageService);
  toastService:ToastService = inject(ToastService)
  lots : Lot[] = []


  private readonly periodService = inject(PeriodService)
  private readonly lotsService = inject(LotsService)
  listPeriodo:Periods[] =[];
  categoriaCargos: CategoryCharge[] = [];

  selectedPeriodId: number | null = null;
  selectedLotId : number = 0;

  showInfo(){
    this.modalService.open(ChargeInfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });
  }
  formattedPeriods: any[] = [];

  loadSelect() {
    this.periodService.get().pipe(
      map((periods) =>
        periods
          .filter((period) => period.state !== 'CLOSE')
          .map((period) => ({
            ...period,
            displayPeriod: `${period.month}/${period.year}`
          }))
      )
    ).subscribe((formattedPeriods) => {
      this.formattedPeriods = formattedPeriods;
    });

    this.lotsService.get().subscribe((data: Lot[]) => {
      this.lots = data;
    });

    this.chargeService.getCategoriesExcFines().subscribe((data: CategoryCharge[]) => {
      this.categoriaCargos = this.keysToCamel(data);
    });
  }

  comparePeriodFn(period1: any, period2: any) {
    return period1 && period2 ? period1.id === period2.id : period1 === period2;
  }

  toCamel(s: string) {
    return s.replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '');
    });
  }

  keysToCamel(o: any): any {
    if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
      const n: {[key: string]: any} = {};       Object.keys(o).forEach((k) => {
        n[this.toCamel(k)] = this.keysToCamel(o[k]);
      });       return n;
    } else if (Array.isArray(o)) {
      return o.map((i) => {         return this.keysToCamel(i);       });
    }     return o;
  }


  chargeForm: FormGroup;

  constructor() {
    this.chargeForm = this.fb.group({
      lotId: ['', Validators.required],
      date: ['', Validators.required],
      periodId: ['', Validators.required],
      amount: ['', [Validators.required]],
      categoryChargeId: ['', Validators.required],
      description:['']
    });
    this.chargeForm.get('categoryChargeId')?.valueChanges.subscribe(() => {
      let id :Number = this.chargeForm.get('categoryChargeId')?.value;

      this.ValidarMonto(this.categoriaCargos.find(c => c.categoryChargeId === id) as CategoryCharge);
    });
    this.user = this.storage.getFromSessionStorage('user');
  }
  ValidarMonto(categoryCharge : CategoryCharge) {
    if (categoryCharge == undefined) return

    switch(categoryCharge.amountSign) {
      case ('Positivo'):
        this.chargeForm.get('amount')?.setValidators([
          Validators.required,
          Validators.min(0),
        ]);
        this.chargeForm.get('amount')?.updateValueAndValidity();
        break;
      case ChargeType.PERCENTAGE:
        break;
      case ChargeType.NEGATIVE:
        this.chargeForm.get('amount')?.setValidators([
          Validators.required,
          Validators.max(0),
        ]);
        this.chargeForm.get('amount')?.updateValueAndValidity();

        break;
      default:
        break;

    }
    this.chargeForm.get('amount')?.updateValueAndValidity();
  }


  onBack() {
    this.router.navigate(['expenses/cargos']);
  }

  onSubmit(): void {
    if (this.chargeForm.valid) {
      const formValue = this.chargeForm.value;
      const charge: Charge = {
        ...formValue,
        date: new Date(formValue.date).toISOString(),
      };
      if(this.chargeForm.get('categoryChargeId')?.value !=6){
        charge.amountSign = ChargeType.ABSOLUTE;
      } else{
        charge.amountSign = ChargeType.NEGATIVE;
      }
      const charges = this.camelToSnake(charge) as Charge;

      this.chargeService.addCharge(charges,this.user.value.id).subscribe(
        (response) => {
          this.toastService.sendSuccess("El cargo se ha registrado correctamente");
          this.chargeForm.reset();
          this.router.navigate([`expenses/cargos`]);
        },
        (error) => {
          this.toastService.sendError("Error al registrar el cargo");
        }
      );
    }
  }

    // #region Modal
    openNewCategoryModal() {
      const modalRef = this.modalService.open(NewCategoryChargeModalComponent, {
        ariaLabelledBy: 'modal-basic-title',
      });

      modalRef.result.then((result) => {
        if (result) {
          if (result.success) {
            this.toastService.sendSuccess(result.message);
            this.loadSelect();
          } else {
            this.toastService.sendError(result.message);
          }
        }
      });
    }

  camelToSnake(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.camelToSnake(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        acc[snakeKey] = this.camelToSnake(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  }

  ngOnInit(): void {
    let user = this.storage.getFromSessionStorage('user') as User;
    this.rolCode = user.value.roles.filter(rol => rol.code === URLTargetType.FINANCE).length == 1 ? true : false
    this.loadSelect();
  }
}
