import { Component, inject, Input } from '@angular/core';
import { InfractionServiceService } from '../../services/infraction-service.service';
import { ToastService } from 'ngx-dabd-grupo01';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { UserDataService, UserData } from '../../../../../shared/services/user-data.service';

@Component({
  selector: 'app-reject-infraction-modal',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, ReactiveFormsModule],
  templateUrl: './reject-infraction-modal.component.html',
  styleUrl: './reject-infraction-modal.component.scss',
})
export class RejectInfractionModalComponent {
  @Input() infractionId: number | undefined;

  //services
  private infractionService = inject(InfractionServiceService);

  private toastService = inject(ToastService);

  //variables
  description: string | undefined;

  //variable para los archivos
  selectedFiles: File[] = [];

  // Modal logic
  activeModal = inject(NgbActiveModal);

  userDataService = inject(UserDataService);
  userData!: UserData;

  loadUserData() {
    this.userDataService.loadNecessaryData().subscribe((response) => {
      if (response) {
        this.userData = response;
      }
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  // Método para enviar el formulario de reclamos
  submit() {
    if (this.description && this.userData.id) {
      const formData = new FormData();

      formData.append('description', 'Rechazo: ' + this.description);
      formData.append('user_id', this.userData.id.toString());
      formData.append('status', 'REJECTED');

      this.infractionService
        .changeInfractionStatus(formData, this.infractionId!, this.userData.id)
        .subscribe({
          next: (response) => {
            this.activeModal.close(response);
            this.toastService.sendSuccess(
              'Se rechazó correctamente a la infracción.'
            );
          },
          error: (error) => {
            this.toastService.sendError('Error en el rechazo.');
          },
        });
    } else {
      console.error('Faltan datos obligatorios en el formulario');
    }
  }
}
