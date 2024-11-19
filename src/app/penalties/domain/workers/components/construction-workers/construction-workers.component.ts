import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ConstructionService } from '../../../construction/services/construction.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkerFormComponent } from '../worker-form/worker-form.component';

import {
  ConfirmAlertComponent,
  TableColumn,
  TableComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { WorkerService } from '../../services/worker.service';
import { GetValueByKeyForEnumPipe } from '../../../../shared/pipes/get-value-by-key-for-status.pipe';
import { DocTypeEnum } from '../../models/worker.model';
import { UserData, UserDataService } from '../../../../shared/services/user-data.service';

@Component({
  selector: 'app-construction-workers',
  standalone: true,
  imports: [CommonModule, TableComponent, GetValueByKeyForEnumPipe],
  templateUrl: './construction-workers.component.html',
  styleUrl: './construction-workers.component.css',
})
export class ConstructionWorkersComponent implements AfterViewInit {
  // Inputs:
  @Input() workers: any[] = [];
  @Input() constructionStatus: string | undefined;
  @Input() constructionId: number | undefined;

  // Services:
  private modalService = inject(NgbModal);
  private workerService = inject(WorkerService);
  private constructionService = inject(ConstructionService);
  toastService = inject(ToastService);
  WorkerDocTypeEnum = DocTypeEnum;

  // Properties:
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('docType') docTypeTemplate!: TemplateRef<any>;

  columns: TableColumn[] = [];

  // Methods:

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.columns = [
        { headerName: 'Dirección', accessorKey: 'address' },
        { headerName: 'Nombre', accessorKey: 'name' },
        { headerName: 'Apellido', accessorKey: 'last_name' },
        {
          headerName: 'Tipo Doc.',
          accessorKey: 'doc_type',
          cellRenderer: this.docTypeTemplate,
        },
        { headerName: 'Documento', accessorKey: 'document' },
        {
          headerName: 'Acciones',
          accessorKey: 'actions',
          cellRenderer: this.actionsTemplate,
        },
      ];
    });
  }

  sendSuccess() {
    let worker = { id: 1 };
    this.toastService.sendError(
      `Worker with ID ${worker.id} was successfully unassigned.`
    );
  }

  openFormModal(): void {
    const modalRef = this.modalService.open(WorkerFormComponent);
    modalRef.componentInstance.constructionId = this.constructionId;
  }

  unAssignWorker(worker: any) {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Estás seguro de que deseas desasignar a ${worker.lastName}, ${worker.name} ?`;

    modalRef.result
      .then((result) => {
        if (result) {
          this.workerService.unAssignWorker(worker.id, this.userData.id).subscribe({
            next: () => {
              this.workers = this.workers.filter((w) => w.id !== worker.id);
              this.toastService.sendSuccess(
                `Worker with ID ${worker.id} was successfully unassigned.`
              );
            },
            error: () => {
              console.error('Error al desasignar el trabajador');
            },
          });
        }
      })
      .catch(() => {
        console.log('Desasignación cancelada');
      });
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

  ngOnInit() {
    this.loadUserData();
  }
}
