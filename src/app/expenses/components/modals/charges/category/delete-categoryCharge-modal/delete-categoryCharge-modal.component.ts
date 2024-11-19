import { Component,inject,Input } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import { CategoryCharge } from '../../../../../models/charge';
import { ChargeService } from '../../../../../services/charge.service';
import { User } from '../../../../../models/user';
import { StorageService } from '../../../../../services/storage.service';
import { URLTargetType } from '../../../../../../users/models/role';

@Component({
  selector: 'app-delete-category-modal',
  standalone: true,
  imports: [],
  templateUrl: './delete-categoryCharge-modal.component.html',
  styleUrl: './delete-categoryCharge-modal.component.css'
})
export class DeleteCategoryModalComponent {
  @Input() category!: CategoryCharge;
  user : User;
  rolCode : boolean = false;

  private storage = inject(StorageService);
  constructor(
    public activeModal: NgbActiveModal,
    private categoryService: ChargeService
  ) { 
    this.user = this.storage.getFromSessionStorage('user') as User;
    this.rolCode = this.user.value.roles.filter(rol => rol.code === URLTargetType.FINANCE).length == 1 ? true : false
  }

  confirmDelete() {

    this.categoryService.deleteCategoryCharge(this.category.categoryChargeId!)
      .subscribe({
        next: (response) => {
          this.activeModal.close({
            success: true,
            message: 'La categoría ha sido eliminada correctamente.',
            data: response
          });
        },
        error: (error) => {
          this.activeModal.close({
            success: false,
            message: 'Ha ocurrido un error al eliminar la categoría. Por favor, inténtelo de nuevo.',
            error: error
          });
        }
      });
  }
}
