import { Component, inject, Input } from '@angular/core';
import { Bill } from '../../../../models/bill';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BillService } from '../../../../services/bill.service';
import { StorageService } from '../../../../services/storage.service';
import { User } from '../../../../models/user';

@Component({
  selector: 'app-delete-bill-modal',
  standalone: true,
  imports: [],
  templateUrl: './delete-bill-modal.component.html',
  styleUrl: './delete-bill-modal.component.scss'
})
export class DeleteBillModalComponent {
  @Input() bill!: Bill;
  @Input() status!: string;
  @Input() action!: string;

  private readonly billService = inject(BillService);
  private readonly storageService = inject(StorageService);

  constructor(public activeModal: NgbActiveModal) { }

  confirmDelete() {
    let user = this.storageService.getFromSessionStorage('user') as User;

    this.billService.patchBill(this.bill.expenditureId!, this.status, user.value.id)
      .subscribe({
        next: (response) => {
          this.activeModal.close({
            success: true,
            message: 'La acción ha sido realizada correctamente.',
            data: response
          });
        },
        error: (error) => {
          this.activeModal.close({
            success: false,
            message: 'Ha ocurrido un error al modificar el gasto. Por favor, inténtelo de nuevo.',
            error: error
          });
        }
      });
  }
}
