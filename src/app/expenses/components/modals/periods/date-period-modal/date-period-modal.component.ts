import { NgClass } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PeriodService } from '../../../../services/period.service';
import { ToastService } from 'ngx-dabd-grupo01';
import { StorageService } from '../../../../services/storage.service';
import { User } from '../../../../models/user';

function periodValidator(nextDate: string): ValidatorFn {
  return (control) => {
    const fecha = new Date(control.value);
    if (isNaN(fecha.getTime())) {
      return { fechaInvalida: true };
    }

    if (!nextDate || !/^\d{2}\/\d{4}$/.test(nextDate)) {
      return { nextDateInvalido: true };
    }

    const [mesString, añoString] = nextDate.split('/');
    const añoNext = parseInt(añoString, 10);
    const mesNext = parseInt(mesString, 10) - 1;

    const inicioNextDate = new Date(añoNext, mesNext, 15);
    const finNextDate = new Date(añoNext, mesNext + 1, 0);

    if (fecha >= inicioNextDate && fecha <= finNextDate) {
      return null;
    }

    return { periodValidatorError: true };
  };
}

@Component({
  selector: 'app-date-period-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './date-period-modal.component.html',
  styleUrls: ['./date-period-modal.component.css']
})
export class DatePeriodModalComponent implements OnInit {
  @Input() nextDate?: string;
  @Input() id?: number;
  period: FormGroup;

  private readonly toastService = inject(ToastService);
  private readonly storage = inject(StorageService)

  constructor(
    private formBuilder: FormBuilder,
    public activeModal: NgbActiveModal,
    private periodService: PeriodService
  ) {
    this.period = this.formBuilder.group({
      endDate: ['', {
        validators: [Validators.required],
        updateOn: 'blur'
      }],
    });
  }

  ngOnInit(): void {
    if (this.nextDate) {
      this.period.get('endDate')?.setValidators([
        Validators.required,
        periodValidator(this.nextDate)
      ]);
      this.period.get('endDate')?.updateValueAndValidity();
    }
  }

  savePeriod() {
    if (this.period.valid) {
      let user = this.storage.getFromSessionStorage('user') as User;

      const period = { end_date: new Date(this.period.value.endDate).toISOString() };

      let saveObservable;

      if (this.id != null) {
        saveObservable = this.id == null
          ? this.periodService.new(period, user.value.id)
          : this.periodService.updatePeriod(this.id, period, user.value.id);
      } else {
        saveObservable = this.id == null
          ? this.periodService.new(period, user.value.id)
          : this.periodService.new(period, user.value.id);
      }

      saveObservable.subscribe({
        next: (response: any) => {
          this.toastService.sendSuccess('La operación ha sido con éxito')
          this.activeModal.close({
            success: true
          })
        },
        error: (error: any) => {
          this.toastService.sendError(error)
        }
      });
    } else {
      this.activeModal.close({
        success: false,
        message: 'Por favor, complete todos los campos requeridos correctamente.'
      });
    }
  }
}
