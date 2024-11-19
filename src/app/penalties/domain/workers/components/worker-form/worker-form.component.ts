import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkerService } from '../../services/worker.service';
import { DocTypeEnum, WorkerRequestDto } from '../../models/worker.model';
import {
  FormConfig,
  FormFieldsComponent,
  ToastService,
} from 'ngx-dabd-grupo01';

@Component({
  selector: 'app-worker-form',
  standalone: true,
  imports: [FormFieldsComponent],
  templateUrl: './worker-form.component.html',
  styleUrl: './worker-form.component.css',
})
export class WorkerFormComponent {
  // Inputs:
  @Input() constructionId: number | null = null;

  @ViewChild(FormFieldsComponent) formFieldsComponent!: FormFieldsComponent;

  // Services:
  activeModal = inject(NgbActiveModal);

  private workerService = inject(WorkerService);
  private toastService = inject(ToastService);

  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Properties:
  isButtonOutside: boolean = true;

  constructionFormConfig: FormConfig = {
    formColumns: 2,
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        validations: { required: true },
      },
      {
        name: 'last_name',
        label: 'Apellido',
        type: 'text',
        validations: { required: true },
      },
      {
        name: 'address',
        label: 'Dirección',
        type: 'text',
        validations: { required: true },
        fieldSpan: 2,
      },
      {
        name: 'doc_type',
        label: 'Tipo Doc.',
        type: 'select',
        options: Object.keys(DocTypeEnum).map((key) => ({
          value: key,
          name: DocTypeEnum[key as keyof typeof DocTypeEnum],
        })),
        fieldSpan: 1,
      },
      {
        name: 'document',
        label: 'Documento',
        type: 'number',
        validations: { required: true, maxLength: 20 },
        fieldSpan: 1,
      },
    ],
  };

  onSubmit = (formValue: any): void => {
    const worker: WorkerRequestDto = {
      construction_id: this.constructionId!,
      address: formValue.address,
      doc_type: formValue.doc_type,
      document: formValue.document,
      last_name: formValue.last_name,
      name: formValue.name,
    };

    this.workerService.registerWorker(worker).subscribe({
      next: (result) => {
        this.activeModal.close();
        this.toastService.sendSuccess(`Se creó el trabajador ${result.id}`);
      },
      error: (error) => {
        this.toastService.sendError('Ocurrió un error al crear el trabajador');
      },
    });
  };

  submitForm(): void {
    this.formFieldsComponent.submit();
  }
}
