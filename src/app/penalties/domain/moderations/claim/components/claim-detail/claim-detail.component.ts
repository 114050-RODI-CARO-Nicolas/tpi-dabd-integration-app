import { Component, inject, OnInit } from '@angular/core';
import {
  ConfirmAlertComponent,
  MainContainerComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { SanctionTypeService } from '../../../sanction-type/services/sanction-type.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SanctionType } from '../../../sanction-type/models/sanction-type.model';
import { ClaimService } from '../../service/claim.service';
import { ClaimDTO, ClaimStatusEnum } from '../../models/claim.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetValueByKeyForEnumPipe } from '../../../../../shared/pipes/get-value-by-key-for-status.pipe';
import { SanctionTypeSelectComponent } from '../../../sanction-type/components/sanction-type-select/sanction-type-select.component';

import { firstValueFrom } from 'rxjs';
import { ClaimDocumentsComponent } from '../claim-documents/claim-documents.component';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';
import { PlotService } from '../../../../../../users/services/plot.service';
import { Plot } from '../../../../../../users/models/plot';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MainContainerComponent,
    NgbTooltipModule,
    GetValueByKeyForEnumPipe,
    SanctionTypeSelectComponent,
    ClaimDocumentsComponent,
  ],
  templateUrl: './claim-detail.component.html',
  styleUrl: './claim-detail.component.scss',
})
export class ClaimDetailComponent implements OnInit {
  claimService = inject(ClaimService);
  sanctionTypeService = inject(SanctionTypeService);

  plotService = inject(PlotService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  private router = inject(Router);
  private readonly toastService = inject(ToastService);
  ClaimStatusEnum = ClaimStatusEnum;

  claim: ClaimDTO | undefined;

  editing: boolean = false;

  plots: Plot[] | undefined;

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

    this.activatedRoute.params.subscribe(async (params) => {
      const mode = params['mode'];
      this.editing = mode === 'edit';
      const id = params['id'];

      try {
        const claim: ClaimDTO | undefined = await this.getClaimbyId(id);

        //siu no hay rol o user id lo devuelvo
        /*         if (this.role === '' || this.userId === undefined) {
          this.router.navigate(['claim']);
        } */

        //si el user no es admin y nbo es quien lo creo o el propietario del infractor, entonces no puede ver la claim
        /*  if (
          this.role !== 'ADMIN' &&
          this.userId !== claim!.created_by &&
          !this.userPlotsIds?.includes(claim!.plot_id)
        ) {
          this.router.navigate(['claim']);
        } */

        //si esta editando y la claum no esta en sent, lo mando a detail (siendo que paso la validacion anterioir, asi que si puede ver)
        if (
          this.editing &&
          claim?.claim_status !== ('SENT' as ClaimStatusEnum)
        ) {
          this.router.navigate(['claim', claim?.id, 'detail']);
        }
      } catch (error) {
        console.error('Error fetching claim:', error);
      }
    });

    this.loadPlots();
  }

  loadPlots() {
    this.plotService.getAllPlots(0, 100000, true).subscribe((response) => {
      if (response) {
        this.plots = response.content;
      }
    });
  }

  async getClaimbyId(id: number): Promise<ClaimDTO | undefined> {
    const claim = await firstValueFrom(this.claimService.getClaimById(id));
    this.claim = claim;
    return claim;
  }

  onSanctionTypeChange(selected: SanctionType | undefined) {
    if (this.claim || selected) {
      this.claim!.sanction_type = selected!;
    }
  }

  edit() {
    this.editing = true;
  }

  cancelEdit() {
    this.editing = false;
    // this.resetSanctionType();
  }
  goBack() {
    this.router.navigate(['penalties/claim']);
  }

  saveEdit() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Estás seguro de que desea modificar el reclamo?`;

    modalRef.result.then((result) => {
      if (result) {
        this.claimService.updateClaim(this.claim!).subscribe({
          next: () => {
            this.toastService.sendSuccess(`Reclamo actualizado exitosamente.`);
            this.editing = false;
          },
          error: () => {
            this.toastService.sendError(`Error actualizando reclamo.`);
          },
        });
      }
    });
  }

  infoModal() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertType = 'info';

    modalRef.componentInstance.alertTitle = 'Ayuda';
    modalRef.componentInstance.alertMessage = `Esta pantalla proporciona una vista detallada del reclamo seleccionado, permitiéndole analizar toda la información relacionada de manera clara y estructurada. En esta sección puede acceder a todos los datos relevantes sobre el reclamo de forma precisa.`;
  }
}
