import {
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConstructionService } from '../../services/construction.service';
import {
  CONSTRUCTION_STATUSES_ENUM,
  CONSTRUCTION_STATUSES,
  ConstructionResponseDto,
  ConstructionStatus,
  ConstructionTab,
  ConstructionUpdateRequestDto,
} from '../../models/construction.model';
import { CommonModule } from '@angular/common';
import { ConstructionWorkersComponent } from '../../../workers/components/construction-workers/construction-workers.component';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ConstructionDocumentationListComponent } from '../../../construction-documentation/components/construction-documentation-list/construction-documentation-list.component';
import { NotesListComponent } from '../../../notes/notes-list/notes-list.component';
import { WorkerService } from '../../../workers/services/worker.service';
import {
  ConfirmAlertComponent,
  MainContainerComponent,
  TableComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { GetValueByKeyForEnumPipe } from '../../../../shared/pipes/get-value-by-key-for-status.pipe';
import {
  UserDataService,
  UserData,
} from '../../../../shared/services/user-data.service';

@Component({
  selector: 'app-construction-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MainContainerComponent,
    TableComponent,
    ConstructionWorkersComponent,
    NgbTooltipModule,
    ConstructionDocumentationListComponent,
    NotesListComponent,
    GetValueByKeyForEnumPipe,
  ],
  templateUrl: './construction-detail.component.html',
  styleUrl: './construction-detail.component.css',
})
export class ConstructionDetailComponent implements OnInit {
  // Services:
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private constructionService = inject(ConstructionService);
  private workerService = inject(WorkerService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);

  // Properties:
  editConstruction!: ConstructionUpdateRequestDto;
  construction: ConstructionResponseDto | undefined;
  activeTab: ConstructionTab = 'documentation';
  selectedStatus!: ConstructionStatus;
  statusOptions: ConstructionStatus[] = CONSTRUCTION_STATUSES;
  successMessage: string | null = null;
  CONSTRUCTION_STATUSES_ENUM = CONSTRUCTION_STATUSES_ENUM;
  @ViewChild('confirmAlertContentTemplate')
  confirmAlertContentTemplate!: TemplateRef<any>;
  rejectForm: FormGroup;
  mode: 'detail' | 'edit' = 'detail';

  constructor(private fb: FormBuilder) {
    this.rejectForm = this.fb.group({
      rejectReason: ['', Validators.required],
    });
  }

  get rejectReasonControl() {
    return this.rejectForm.get('rejectReason');
  }

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

    this.activatedRoute.params.subscribe((params) => {
      const id = params['id'];
      const mode = params['mode'];
      this.getConstructionById(id);
      this.mode = mode === 'edit' ? 'edit' : 'detail';
    });

    this.workerService.message$.subscribe((message) => {
      if (message) {
        if (message.type === 'success') {
          this.getConstructionById(this.construction?.construction_id!);
          this.successMessage = message.message;
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        }
      } else {
        this.successMessage = null;
      }
    });
  }

  getConstructionById(id: number) {
    this.constructionService
      .getConstructionById(id)
      .subscribe((construction) => {
        this.construction = construction;
        this.selectedStatus =
          (construction?.construction_status as ConstructionStatus) ||
          'PLANNED';
        const splittedStartDate = construction?.planned_start_date?.split('/');
        const planned_start_date =
          splittedStartDate?.[2] +
            '-' +
            splittedStartDate?.[1] +
            '-' +
            splittedStartDate?.[0] || '';

        const splittedEndDate = construction?.planned_end_date?.split('/');
        const planned_end_date =
          splittedEndDate?.[2] +
            '-' +
            splittedEndDate?.[1] +
            '-' +
            splittedEndDate?.[0] || '';

        this.editConstruction = {
          project_name: construction?.project_name || '',
          description: construction?.project_description || '',
          planned_start_date: planned_start_date,
          planned_end_date: planned_end_date,
          start_time: construction?.start_time,
          end_time: construction?.end_time,
        };
      });
  }

  setActiveTab(tab: ConstructionTab): void {
    this.activeTab = tab;
  }

  isActiveTab(tab: ConstructionTab): boolean {
    return this.activeTab === tab;
  }

  goBack = (): void => {
    this.router.navigate(['penalties/constructions']);
  };

  updateStatus(): void {
    if (this.selectedStatus !== this.construction?.construction_status) {
      this.constructionService
        .updateConstructionStatus({
          construction_id: this.construction?.construction_id || 0,
          status: this.selectedStatus,
        })
        .subscribe(() => {
          if (this.construction) {
            this.construction.construction_status = this.selectedStatus;
          }
        });
    }
  }

  saveChanges(): void {
    if (this.construction) {
      this.constructionService
        .updateConstruction(
          this.construction.construction_id,
          this.editConstruction
        )
        .subscribe({
          next: (updatedConstruction) => {
            this.getConstructionById(updatedConstruction.construction_id);
            this.toastService.sendSuccess(
              'Los datos se actualizaron correctamente'
            );
            this.mode = 'detail';
          },
          error: (err) => {
            console.error('Error al actualizar los datos', err);
            this.toastService.sendError(
              'Ocurrió un error al actualizar los datos'
            );
          },
        });
    }
  }

  onConstructionApproved(constructionId: number): void {
    if (this.construction) {
      this.constructionService
        .approveConstruction(constructionId)
        .subscribe(() => {
          if (this.construction) {
            this.construction.construction_status = 'APPROVED';
            this.toastService.sendSuccess(
              'Se aprobó la construcción correctamente'
            );
          }
        });
    }
  }

  onConstructionStarted(constructionId: number): void {
    if (this.construction) {
      this.constructionService
        .startConstruction(constructionId)
        .subscribe(() => {
          if (this.construction) {
            this.construction.construction_status = 'IN_PROGRESS';
            this.toastService.sendSuccess(
              'Se inició la construcción correctamente'
            );
          }
        });
    }
  }

  onConstructionFinished(constructionId: number): void {
    if (this.construction) {
      this.constructionService
        .finishConstruction(constructionId, this.userData.id)
        .subscribe(() => {
          if (this.construction) {
            this.construction.construction_status = 'COMPLETED';
            this.toastService.sendSuccess(
              'Se terminó la construcción correctamente'
            );
          }
        });
    }
  }

  onConstructionReview(constructionId: number): void {
    if (this.construction) {
      this.constructionService
        .onReviewConstruction(constructionId)
        .subscribe(() => {
          if (this.construction) {
            this.construction.construction_status = 'ON_REVISION';
            this.toastService.sendSuccess(
              'Se envio a revisión la construcción correctamente'
            );
          }
        });
    }
  }

  onConstructionRejected(constructionId: number, reason: string): void {
    if (this.construction) {
      this.constructionService
        .rejectConstruction(constructionId, reason)
        .subscribe({
          next: (constructionResponse: any) => {
            if (this.construction) {
              this.construction.construction_status = 'REJECTED';
              this.construction.notes = constructionResponse.notes;
              this.toastService.sendSuccess(
                'Se rechazó la construcción correctamente'
              );
            }
          },
          error: (err) => {
            this.toastService.sendError(
              'Ocurrió un error al rechazar la construcción'
            );
          },
        });
    }
  }

  onConstructionUpdated(): void {
    this.getConstructionById(this.construction?.construction_id || 0);
  }

  isConstructionAbleToApprove() {
    if (this.construction?.construction_documentation) {
      const isSomeDocPending =
        this.construction.construction_documentation.some(
          (doc: { state: string }) => doc.state === 'PENDING_APPROVAL'
        );
      const isSomeDocRejected =
        this.construction.construction_documentation.some(
          (doc: { state: string }) => doc.state === 'REJECTED'
        );

      return !isSomeDocPending && !isSomeDocRejected;
    } else {
      return false;
    }
  }

  isConstructionAbleToReview() {
    if (
      (this.construction?.construction_documentation &&
        this.construction.construction_documentation.length > 0 &&
        this.construction?.construction_status === 'LOADING') ||
      this.construction?.construction_status === 'REJECTED'
    ) {
      return true;
    } else {
      return false;
    }
  }

  approveConstruction() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Está seguro de que desea aprobar esta obra?`;
    modalRef.componentInstance.alertType = 'info';

    modalRef.result
      .then((result) => {
        if (result) {
          this.onConstructionApproved(this.construction?.construction_id || 0);
        }
      })
      .catch(() => {});
  }

  rejectConstruction() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);

    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Está seguro de que desea rechazar esta obra?`;
    modalRef.componentInstance.alertType = 'warning';

    modalRef.componentInstance.content = this.confirmAlertContentTemplate;

    modalRef.componentInstance.onConfirm = () => {
      if (this.rejectForm.valid) {
        const rejectReason = this.rejectForm.value.rejectReason;
        this.onConstructionRejected(
          this.construction?.construction_id || 0,
          rejectReason
        );
        modalRef.close();
        this.rejectForm.reset();
      } else {
        this.rejectForm.markAllAsTouched();
      }
    };
  }

  onReviewConstruction() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Está seguro de que desea enviar a revisión esta obra?`;
    modalRef.componentInstance.alertType = 'info';

    modalRef.result
      .then((result) => {
        if (result) {
          this.onConstructionReview(this.construction?.construction_id || 0);
        }
      })
      .catch(() => {});
  }

  onStartConstruction() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Está seguro de que desea iniciar esta obra?`;
    modalRef.componentInstance.alertType = 'info';

    modalRef.result
      .then((result) => {
        if (result) {
          this.onConstructionStarted(this.construction?.construction_id || 0);
        }
      })
      .catch(() => {});
  }

  onFinishConstruction() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Está seguro de que desea terminar esta obra? Los accesos se darán de baja y no podrá interactuar más con este registro`;
    modalRef.componentInstance.alertType = 'warning';

    modalRef.result
      .then((result) => {
        if (result) {
          this.onConstructionFinished(this.construction?.construction_id || 0);
        }
      })
      .catch(() => {});
  }

  infoModal() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertType = 'info';

    modalRef.componentInstance.alertTitle = 'Ayuda';
    modalRef.componentInstance.alertMessage = `Esta pantalla proporciona una vista detallada de la obra seleccionada, permitiéndole analizar toda la información relacionada de manera clara y estructurada. En esta sección puede acceder a todos los datos relevantes sobre la obra de forma precisa.`;
  }
}
