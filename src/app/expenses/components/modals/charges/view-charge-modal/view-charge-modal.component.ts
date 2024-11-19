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
  selector: 'app-view-charge-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './view-charge-modal.component.html',
  styleUrl: './view-charge-modal.component.css'
})
export class ViewChargeModalComponent implements OnInit {
    //VARIABLE DE USER
    user : User| undefined;
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
      monto: [{ value: '', disabled: true }, Validators.required],
      description: [{ value: '', disabled: true }],
    });
  }

  ngOnInit() {
    this.user = this.storage.getFromSessionStorage('user') as User;

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
      monto: this.charge?.amount ?? 0,
      description: this.charge?.description ?? '',
    });
  }

  loadSelect(): Observable<void> {
    return forkJoin([
      this.periodService.get(),
      this.lotsService.get(),
      this.chargeService.getCategoryCharges(false)
    ]).pipe(
      tap(([periodos, lots, categoryCharges]) => {
        this.periodos = periodos;
        this.lots = lots;
        this.categoryCharges = categoryCharges;
      }),
      map(() => undefined) // Para que el observable de `loadSelect` sea de tipo `Observable<void>`
    );
  }

  getPlotNumber(lotId : number){
    const lot = this.lots.find(lot => lot.id === lotId);
    return lot ? lot.plot_number : undefined;
  }

  loadCategoryCharge(){
    this.chargeService.getCategoryCharges(false).subscribe((data: CategoryCharge[]) => {
      this.categoryCharges = data;
    })
  }

  enableEdit() {
    this.isEditing = true;
    this.chargeForm.enable();
    this.chargeForm.get('fechaEmision')?.disable();
    this.chargeForm.get('lote')?.disable();

  }

  saveChanges() {    
    if (this.chargeForm.valid) {
      const updatedCharge: Charge = {
        ...this.charge,
        ...this.chargeForm.value,
      };
      console.log(updatedCharge);
      this.chargeService.updateCharge(updatedCharge,this.user?.value.id!).subscribe(
        (response) => {
          console.log('Cargo actualizado con éxito:', response);
          this.activeModal.close(true);
        },
        (error) => {
          console.error('Error al actualizar el cargo:', error);
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
