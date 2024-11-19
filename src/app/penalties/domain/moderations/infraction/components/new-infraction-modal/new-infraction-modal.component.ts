import {
  Component,
  ElementRef,
  inject,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ModalDismissReasons,
  NgbActiveModal,
  NgbInputDatepicker,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { SanctionType } from '../../../sanction-type/models/sanction-type.model';
import { SanctionTypeService } from '../../../sanction-type/services/sanction-type.service';
import { InfractionServiceService } from '../../services/infraction-service.service';
import { InfractionDto } from '../../models/infraction.model';
import { CommonModule, NgClass } from '@angular/common';
import { ClaimDTO } from '../../../claim/models/claim.model';
import { TruncatePipe } from '../../../../../shared/pipes/truncate.pipe';
import { ToastService } from 'ngx-dabd-grupo01';
import { PlotService } from '../../../../../../users/services/plot.service';
import { Plot } from '../../../../../../users/models/plot';

@Component({
  selector: 'app-new-infraction-modal',
  standalone: true,
  imports: [
    NgbInputDatepicker,
    FormsModule,
    NgClass,
    CommonModule,
    ReactiveFormsModule,
    TruncatePipe,
  ],
  templateUrl: './new-infraction-modal.component.html',
  styleUrl: './new-infraction-modal.component.scss',
})
export class NewInfractionModalComponent {
  //services
  activeModal = inject(NgbActiveModal);
  private sanctionService = inject(SanctionTypeService);
  private infractionService = inject(InfractionServiceService);
  private plotService = inject(PlotService);

  toastService = inject(ToastService);

  //variables
  plots: Plot[] | undefined;
  sanctionTypes: SanctionType[] | undefined;

  @Input() claims: ClaimDTO[] = [];
  @Input() sanctionTypeNumber: number | undefined;
  @Input() plotId: number | undefined;
  @Input() userId: number | undefined;

  description: string | undefined;

  // Modal logic
  private modalService = inject(NgbModal);
  closeResult = '';

  open(content: TemplateRef<any>) {
    this.loadPlots();

    this.sanctionService.getPaginatedSanctionTypes(1, 10).subscribe({
      next: (response) => {
        this.sanctionTypes = response.items;
      },
      error: (error) => {},
    });

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }

  private getDismissReason(reason: any): string {
    switch (reason) {
      case ModalDismissReasons.ESC:
        return 'by pressing ESC';
      case ModalDismissReasons.BACKDROP_CLICK:
        return 'by clicking on a backdrop';
      default:
        return `with: ${reason}`;
    }
  }

  loadPlots() {
    this.plotService.getAllPlots(0, 100000, true).subscribe((response) => {
      if (response) {
        this.plots = response.content;
      }
    });
  }

  submitInfraction() {
    if (this.plotId && this.sanctionTypeNumber && this.description) {
      const newInfraction: InfractionDto = {
        plot_id: this.plotId,
        description: this.description,
        sanction_type_id: this.sanctionTypeNumber,
        claims_ids: this.claims.map((claim) => claim.id),
      };

      this.infractionService
        .createInfraction(newInfraction, this.userId!)
        .subscribe({
          next: (response) => {
            this.toastService.sendSuccess(
              'Infracción ' + response.id + ' creada exitosamente'
            );

            this.activeModal.close(response);
          },
          error: (error) => {
            this.toastService.sendError('Error al crear la infracción');
          },
        });
    } else {
    }
  }
}
