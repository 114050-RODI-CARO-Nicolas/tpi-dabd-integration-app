import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Fine } from '../../models/fine.model';
import { FineStatusEnum } from '../../models/fine-status.enum';
import { FineService } from '../../services/fine.service';
import { UpdateFineStateDTO } from '../../models/update-fine-status-dto';
import { FineInfractionsListComponent } from '../fine-infractions-list/fine-infractions-list.component';
import { GetValueByKeyForEnumPipe } from '../../../../../shared/pipes/get-value-by-key-for-status.pipe';
import { firstValueFrom } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ConfirmAlertComponent,
  MainContainerComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';

@Component({
  selector: 'app-fine-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgClass,
    FineInfractionsListComponent,
    GetValueByKeyForEnumPipe,
    MainContainerComponent,
  ],
  templateUrl: './fine-detail.component.html',
  styleUrl: './fine-detail.component.scss',
})
export class FineDetailComponent {
  FineStatusEnum = FineStatusEnum;
  fineService = inject(FineService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  modalService = inject(NgbModal);
  fineId: number | undefined;
  fine: Fine | undefined;
  initialState: FineStatusEnum | undefined;
  isAdminAndOnAssembly: boolean = false;

  error: string | null = null;
  successMessage: string | null = null;

  userDataService = inject(UserDataService);
  userData!: UserData;

  loadUserData() {
    this.userDataService.loadNecessaryData().subscribe((response) => {
      if (response) {
        this.userData = response;
        this.updateIsAdminAndOnAssembly();
      }
    });
  }

  async ngOnInit() {
    this.loadUserData();

    let id;

    this.route.params.subscribe(async (params) => {
      const mode = params['mode'];
      id = params['id'];
      this.fineId = id;
    });

    try {
      const fine: Fine | undefined = await this.getFineById(id!);
      console.log(
        fine!.fine_state,
        'ON_ASSEMBLY' as FineStatusEnum,
        FineStatusEnum.ON_ASSEMBLY
      );

      this.updateIsAdminAndOnAssembly();
    } catch (error) {
      console.error(error);
    }

    this.fineId = +this.route.snapshot.paramMap.get('id')!;
  }
  updateIsAdminAndOnAssembly() {
    this.isAdminAndOnAssembly =
      this.userDataService.userHasRole(this.userData, 'FINES_ADMIN') &&
      this.fine!.fine_state === ('ON_ASSEMBLY' as FineStatusEnum);
  }

  private async getFineById(fineId: number): Promise<Fine | undefined> {
    const fine = await firstValueFrom(this.fineService.getFineById(fineId));
    this.fine = fine;
    return fine;
  }

  viewInfractionDetail(arg0: number) {
    throw new Error('Method not implemented.');
  }

  save(fineStatus: FineStatusEnum) {
    let fine: UpdateFineStateDTO = {
      fineState: fineStatus,
    };

    this.fineService.updateState(fine, this.fine!.id).subscribe({
      next: (response) => {
        this.toastService.sendSuccess('Se actualizó el estado con éxito.');
        this.ngOnInit();
      },
      error: (error) => {
        this.toastService.sendError('Sucedió un error actualizando la multa.');
      },
    });
  }

  changeFineStatus(fineStatus: string) {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Estás seguro de que desea modificar la multa?. Esta accion es irreversible`;

    modalRef.result.then((result) => {
      if (result) {
        this.save(fineStatus as FineStatusEnum);
      }
    });
  }

  goBack = (): void => {
    window.history.back();
  };

  infoModal() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertType = 'info';

    modalRef.componentInstance.alertTitle = 'Ayuda';
    modalRef.componentInstance.alertMessage = `Esta pantalla proporciona una vista detallada de la multa seleccionada, permitiéndole analizar toda la información relacionada de manera clara y estructurada. En esta sección puede acceder a todos los datos relevantes sobre la multa de forma precisa.`;
  }
}
