import {Component, inject, Input, OnInit} from '@angular/core';
import Category from "../../../../models/category";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CategoryService} from "../../../../services/category.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {NgClass} from "@angular/common";

@Component({
  selector: 'app-edit-category-modal',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule
  ],
  templateUrl: './edit-category-modal.component.html',
  styleUrl: './edit-category-modal.component.css'
})
export class EditCategoryModalComponent implements OnInit{
  @Input() category!: Category;
  editCategoryForm: FormGroup;

  private readonly categoryService = inject(CategoryService)

  constructor(
    private formBuilder: FormBuilder,
    public activeModal: NgbActiveModal,
  ) {
    this.editCategoryForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.editCategoryForm.patchValue({
      name: this.category.name,
      description: this.category.description
    });
  }

  updateCategory() {
    if (this.editCategoryForm.valid) {
      const updatedCategory: Category = {
        ...this.category,
        name: this.editCategoryForm.value.name.trim(),
        description: this.editCategoryForm.value.description.trim()
      };

      this.categoryService.updateCategory(this.category.category_id!, updatedCategory).subscribe({
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
