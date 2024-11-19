import { Component, inject, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'ngx-dabd-grupo01';
import { CommonModule, NgClass } from '@angular/common';
import { InfractionServiceService } from '../../services/infraction-service.service';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';
import { HttpHeaderResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-appeal-infraction-modal',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, ReactiveFormsModule],
  templateUrl: './appeal-infraction-modal.component.html',
  styleUrl: './appeal-infraction-modal.component.scss',
})
export class AppealInfractionModalComponent {
  @Input() infractionId: number | undefined;
  @Input() userId: number | undefined;

  //services

  private infractionService = inject(InfractionServiceService);

  private toastService = inject(ToastService);

  //variables
  description: string | undefined;

  //variable para los archivos
  selectedFiles: File[] = [];

  // Modal logic
  private modalService = inject(NgbModal);
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

  //medotod de agregar archivos
  onFilesSelected(event: any) {
    const files = event.target.files;
    this.selectedFiles = [];
    for (let file of files) {
      this.selectedFiles.push(file);
    }
  }

  // Método para enviar el formulario de reclamos
  submitAppeal() {
    if (this.description && this.userData.id) {
      const formData = new FormData();

      formData.append('description', this.description);

      // Agregar archivos seleccionados
      this.selectedFiles.forEach((file, index) => {
        formData.append(`files`, file, file.name);
      });

      formData.append('user_id', this.userData.id.toString());

      this.infractionService
        .appealInfraction(formData, this.infractionId!, this.userData.id)
        .subscribe({
          next: (response) => {
            this.activeModal.close(response);
            this.toastService.sendSuccess(
              'Se apelo correctamente a la infracción.'
            );
          },
          error: (error) => {
            this.toastService.sendError('Error en la apelación.');
          },
        });
    } else {
      console.error('Faltan datos obligatorios en el formulario');
    }
  }
}
