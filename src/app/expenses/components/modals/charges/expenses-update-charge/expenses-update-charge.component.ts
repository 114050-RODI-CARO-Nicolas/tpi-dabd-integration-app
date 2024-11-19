import { ChargeService } from '../../../../services/charge.service';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryCharge, Charge } from '../../../../models/charge';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';
import { PeriodService } from '../../../../services/period.service';
import { LotsService } from '../../../../services/lots.service';
import Lot from '../../../../models/lot';
import { CommonModule } from '@angular/common';
import Period from '../../../../models/period';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { User } from '../../../../models/user';
import { StorageService } from '../../../../services/storage.service';
import { URLTargetType } from '../../../../../users/models/role';


@Component({
  selector: 'app-expenses-update-charge',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './expenses-update-charge.component.html',
  styleUrl: './expenses-update-charge.component.css',
})
export class ExpensesUpdateChargeComponent implements OnInit {
  //VARIABLE DE USER
  user : User;
  rolCode: boolean= false;
  private storage = inject(StorageService);

  chargeForm: FormGroup;
  private chargeService = inject(ChargeService);
  public activeModal = inject(NgbActiveModal);
  private readonly periodService = inject(PeriodService);
  private readonly lotsService = inject(LotsService);
  isEditing: boolean = false;
  @Input() charge?: Charge;
  lots: Lot[] = [];
  selectedCharges: number[] = [];
  categoryCharges: CategoryCharge[] = [];
  periodos : Period[] = [];
  selectedLotId: number = 0;
  selectedCategoryId: number = 0;
  selectedPeriodId: number = 0;

  constructor(private fb: FormBuilder) {
    this.chargeForm = this.fb.group({
      fechaEmision: [{ value: '', disabled: true }, Validators.required],
      lote: [{ value: '', disabled: true }, Validators.required],
      tipo: [{ value: '', disabled: true }, Validators.required],
      periodo: [{ value: '', disabled: true }, Validators.required],
      amount: [{ value: '', disabled: true }, Validators.required],
      description: [{ value: '', disabled: true }],
    });
    this.user = this.storage.getFromSessionStorage('user') as User;

    this.rolCode = this.user.value.roles.filter(rol => rol.code === URLTargetType.FINANCE).length == 1 ? true : false
  }

  ngOnInit() {
    this.rolCode = this.user.value.roles.filter(rol => rol.code === URLTargetType.FINANCE).length == 1 ? true : false
    this.loadSelect();
    this.loadCategoryCharge();
    this.loadData();
    if(this.isEditing){
      this.enableEdit();
    }
  }

  loadData() {
    if (this.charge) {
      this.loadSelect().subscribe(() => {
        if (this.lots?.length && this.periodos?.length && this.categoryCharges?.length) {
          this.setupChargeForm();
        }
      });
    }
  }

  setupChargeForm() {
    const lotId = this.charge?.lotId!;

    this.selectedCategoryId = this.charge?.categoryCharge?.categoryChargeId!;
    this.selectedPeriodId = this.charge?.period?.id!;
    this.chargeForm.setValue({
      fechaEmision: moment(this.charge?.date).format("YYYY-MM-DD") ,
      lote: this.getPlotNumber(lotId),
      tipo: this.selectedCategoryId,
      periodo: this.selectedPeriodId,
      amount: this.charge?.amount ?? 0,
      description: this.charge?.description ?? '',
    });
  }

  loadSelect(): Observable<void> {
    return forkJoin([
      this.periodService.get(),
      this.lotsService.get(),
      this.chargeService.getCategoryCharges(true)
    ]).pipe(
      tap(([periodos, lots, categoryCharges]) => {
        this.periodos = periodos;
        this.lots = lots;
        this.categoryCharges = categoryCharges;
      }),
      map(() => undefined) // Para que el observable de `loadSelect` sea de tipo `Observable<void>`
    );
  }

  camelToSnake(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.camelToSnake(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        // Convierte la clave de camelCase a snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        // Aplica la conversión recursiva si el valor es un objeto o array
        acc[snakeKey] = this.camelToSnake(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  }

  getPlotNumber(lotId : number){
    const lot = this.lots.find(lot => lot.id === lotId);
    return lot ? lot.plot_number : undefined;
  }

  loadCategoryCharge(){
    this.chargeService.getCategoryCharges(true).subscribe((data: CategoryCharge[]) => {
      this.categoryCharges = data;
    })
  }

  enableEdit() {
    this.isEditing = true;
    this.chargeForm.enable();
    this.chargeForm.get('fechaEmision')?.disable();
    this.chargeForm.get('lote')?.disable();
    this.chargeForm.get('periodo')?.disable();
    this.chargeForm.get('tipo')?.disable();

  }

  saveChanges() {
    debugger
    if (this.chargeForm.valid) {
      const updatedCharge: Charge = {
        ...this.charge,
        ...this.chargeForm.value,
      };
      const charge = this.camelToSnake(updatedCharge);
      this.chargeService.updateCharge(updatedCharge,this.user.value.id).subscribe(
        (response) => {
          this.activeModal.close(true);
        },
        (error) => {
        }
      );
    }
  }

  cancelEdit() {
    if (this.isEditing) {
      this.loadData();
      this.isEditing = false;
      this.chargeForm.disable();
      this.activeModal.dismiss();
    } else {
      this.activeModal.dismiss();
    }
  }
}
