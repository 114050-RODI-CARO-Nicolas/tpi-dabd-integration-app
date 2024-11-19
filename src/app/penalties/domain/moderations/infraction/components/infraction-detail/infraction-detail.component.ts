import { Component, inject, OnInit } from '@angular/core';
import {
  InfractionDto,
  InfractionResponseDTO,
  InfractionStatusEnum,
  InfractionTab,
} from '../../models/infraction.model';
import { InfractionServiceService } from '../../services/infraction-service.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { InfractionClaimListComponent } from '../infraction-claim-list/infraction-claim-list.component';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InfractionProofListComponent } from '../infraction-proof-list/infraction-proof-list.component';
import { NotesListComponent } from '../../../../notes/notes-list/notes-list.component';
import { AppealInfractionModalComponent } from '../appeal-infraction-modal/appeal-infraction-modal.component';
import {
  ConfirmAlertComponent,
  MainContainerComponent,
} from 'ngx-dabd-grupo01';
import { RejectInfractionModalComponent } from '../reject-infraction-modal/reject-infraction-modal.component';
import { ApproveInfractionModalComponent } from '../approve-infraction-modal/approve-infraction-modal.component';
import { GetValueByKeyForEnumPipe } from '../../../../../shared/pipes/get-value-by-key-for-status.pipe';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';

@Component({
  selector: 'app-infraction-detail',
  standalone: true,
  imports: [
    CommonModule,
    MainContainerComponent,
    InfractionClaimListComponent,
    FormsModule,
    InfractionProofListComponent,
    NotesListComponent,
    NgClass,
    GetValueByKeyForEnumPipe,
  ],
  templateUrl: './infraction-detail.component.html',
  styleUrl: './infraction-detail.component.scss',
})
export class InfractionDetailComponent implements OnInit {
  infraction: InfractionResponseDTO | undefined;
  infractionService = inject(InfractionServiceService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  infractionId: number | undefined;

  InfractionStatusEnum = InfractionStatusEnum;

  activeTab: InfractionTab = 'claims';

  userDataService = inject(UserDataService);
  userData!: UserData;

  loadUserData() {
    this.userDataService.loadNecessaryData().subscribe((response) => {
      if (response) {
        this.userData = response;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.loadUserData();

    let id;
    this.activatedRoute.params.subscribe(async (params) => {
      const mode = params['mode'];
      id = params['id'];
      this.infractionId = id;
    });

    try {
      const infraction: InfractionResponseDTO | undefined =
        await this.getInfractionById(id!);
    } catch (error) {
      console.error(error);
    }

    this.infractionId = +this.activatedRoute.snapshot.paramMap.get('id')!;
  }

  private async getInfractionById(
    id: number
  ): Promise<InfractionResponseDTO | undefined> {
    const infraction = await firstValueFrom(
      this.infractionService.getInfractionById(id)
    );

    this.infraction = infraction;
    return infraction;
  }

  goBack(): void {
    window.history.back();
  }
  showRejectButton(): boolean {
    return (
      this.userDataService.userHasRole(this.userData, 'FINES_ADMIN') &&
      (this.infraction!.infraction_status ===
        ('APPEALED' as InfractionStatusEnum) ||
        this.infraction!.infraction_status ===
          ('CREATED' as InfractionStatusEnum))
    );
  }

  showAppealButton(): boolean {
    return (
      this.userDataService.userHasRole(this.userData, 'OWNER') &&
      this.infraction!.infraction_status === ('CREATED' as InfractionStatusEnum)
    );
  }

  showApproveButton(): boolean {
    return (
      this.userDataService.userHasRole(this.userData, 'FINES_ADMIN') &&
      this.infraction!.infraction_status ===
        ('APPEALED' as InfractionStatusEnum)
    );
  }

  setActiveTab(tab: InfractionTab): void {
    this.activeTab = tab;
  }

  rejectInfraction() {
    const modalRef = this.modalService.open(RejectInfractionModalComponent);
    modalRef.componentInstance.infractionId = this.infractionId;
    modalRef.result
      .then((result) => {
        if (result) {
          this.getInfractionById(this.infractionId!);
        }
      })
      .catch(() => {});
  }

  approveInfraction() {
    const modalRef = this.modalService.open(ApproveInfractionModalComponent);
    modalRef.componentInstance.infractionId = this.infractionId;
    modalRef.result
      .then((result) => {
        if (result) {
          this.getInfractionById(this.infractionId!);
        }
      })
      .catch(() => {});
  }

  appealInfraction() {
    const modalRef = this.modalService.open(AppealInfractionModalComponent);
    modalRef.componentInstance.infractionId = this.infractionId;
    modalRef.componentInstance.userId = this.userData.id;

    modalRef.result
      .then((result) => {
        if (result) {
          this.getInfractionById(this.infractionId!);
        }
      })
      .catch(() => {});
  }

  infoModal() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertType = 'info';

    modalRef.componentInstance.alertTitle = 'Ayuda';
    modalRef.componentInstance.alertMessage = `Esta pantalla proporciona una vista detallada de la infracción seleccionada, permitiéndole analizar toda la información relacionada de manera clara y estructurada. En esta sección puede acceder a todos los datos relevantes sobre la infracción de forma precisa.`;
  }
}
