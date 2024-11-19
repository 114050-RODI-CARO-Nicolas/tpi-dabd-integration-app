import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {NgClass} from "@angular/common";
import {map, Observable} from "rxjs";
import { ChargeService } from '../../../../../services/charge.service';
import { CategoryCharge, ChargeType } from '../../../../../models/charge';
import { User } from '../../../../../models/user';
import { URLTargetType } from '../../../../../../users/models/role';
import { StorageService } from '../../../../../services/storage.service';

@Component({
  selector: 'app-new-category-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './new-categoryCharge-modal.component.html',
  styleUrl: './new-categoryCharge-modal.component.css'
})
export class NewCategoryChargeModalComponent {
    //VARIABLE DE USER
    user : User;
    rolCode: boolean= false;
    private storage = inject(StorageService);
  newCategoryForm: FormGroup; 
  /** */
  chargeType : ChargeType[] = [ChargeType.ABSOLUTE,ChargeType.NEGATIVE];

  constructor(
    private formBuilder: FormBuilder,
    public activeModal: NgbActiveModal,
    private chargeService: ChargeService
  ) {
    this.newCategoryForm = this.formBuilder.group({
      name: ['', {
        validators: [Validators.required, this.validatorMulta()],
        asyncValidators: [this.nameValidator()],
        updateOn: 'blur'
      }],
      description: ['', Validators.required],
      amount_Sign: ['',Validators.required]
    });
    this.user = this.storage.getFromSessionStorage('user') as User;

    this.rolCode = this.user.value.roles.filter(rol => rol.code === URLTargetType.FINANCE).length == 1 ? true : false
  }

  private validatorMulta(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const name = control.value?.trim().toLowerCase();
  
      // Si el nombre incluye "multa", devuelve un error
      return name && name.includes("multa") ? { isFine: true } : null;
    };
  }

  private nameValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<any> => {
      const name = control.value?.trim();
      if (!name) {
        return new Observable(observer => {
          observer.next(null);
          observer.complete();
        });
      }
  
      return this.chargeService.validateCategoryName(name).pipe(
        map(exists => (exists ? { nameExists: true } : null))
      );
    };
  }
  

  saveNewCategory() {
    if (this.newCategoryForm.valid) {
      let newCategory: CategoryCharge = this.newCategoryForm.value;
      newCategory.name = newCategory.name?.trim();
      newCategory.description = newCategory.description?.trim();
      newCategory.amountSign = newCategory.amountSign;
      this.chargeService.addCategory(newCategory,this.user.value.id).subscribe({
        next: (response: any) => {
          this.activeModal.close({
            success: true,
            message: 'La categoria se ha añadido correctamente.',
            data: response
          });
        },
        error: (error: any) => {
          let errorMessage = 'Ha ocurrido un error al añadir la categoría. Por favor, inténtelo de nuevo.';
          this.activeModal.close({
            success: false,
            message: errorMessage,
            error: error
          });
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
function of(arg0: null): Observable<any> {
  throw new Error('Function not implemented.');
}

