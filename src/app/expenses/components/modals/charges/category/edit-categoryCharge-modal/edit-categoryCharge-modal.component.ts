import { Component, inject, Input,OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {NgClass} from "@angular/common";
import { ChargeService } from '../../../../../services/charge.service';
import { CategoryCharge } from '../../../../../models/charge';
import { User } from '../../../../../models/user';
import { URLTargetType } from '../../../../../../users/models/role';
import { StorageService } from '../../../../../services/storage.service';


@Component({
  selector: 'app-edit-category-modal',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule
  ],
  templateUrl: './edit-categoryCharge-modal.component.html',
  styleUrl: './edit-categoryCharge-modal.component.css'
})
export class EditCategoryModalComponent implements OnInit{
  @Input() category!: CategoryCharge;
  editCategoryForm: FormGroup;
  //VARIABLE DE USER
  user : User;
  rolCode: boolean= false;
  private storage = inject(StorageService);

  constructor(
    private formBuilder: FormBuilder,
    public activeModal: NgbActiveModal,
    private categoryService: ChargeService
  ) {
    this.editCategoryForm = this.formBuilder.group({
      name: [{ value: '', disabled: true }, Validators.required],
      description: ['', Validators.required],
      amount_Sign: [{ value: '', disabled: true },Validators.required]
    });
    this.user = this.storage.getFromSessionStorage('user') as User;

    this.rolCode = this.user.value.roles.filter(rol => rol.code === URLTargetType.FINANCE).length == 1 ? true : false
  }

  ngOnInit() {
    // Inicializar el formulario con los datos de la categoría
    
    this.editCategoryForm.patchValue({
      name: this.category.name,
      description: this.category.description,
      amount_Sign : this.category.amountSign.toString()
    });
  }

  updateCategory() {
    if (this.editCategoryForm.valid) {
      const updatedCategory: CategoryCharge = {
        ...this.category,
        name: this.editCategoryForm.get('name')?.value,
        description: this.editCategoryForm.get('description')?.value,
        amountSign: this.editCategoryForm.get('amount_Sign')?.value
      };

      this.categoryService.updateCategory(updatedCategory,this.user.value.id).subscribe({
        next: (response: any) => {
          this.activeModal.close({
            success: true,
            message: 'La categoría se ha actualizado correctamente.',
            data: response
          });
        },
        error: (error: any) => {
          let errorMessage = 'Ha ocurrido un error al actualizar la categoría. Por favor, inténtelo de nuevo.';

          if (error.status === 409) {
            errorMessage = 'Ya existe una categoría con este nombre. Por favor, elija un nombre diferente.';
          }

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
