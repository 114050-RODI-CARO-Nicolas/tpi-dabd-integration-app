import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConstructionDocumentationTypeResponseDTO } from '../../models/construction-documentation.model';
import { Observable } from 'rxjs';
import { ConstructionDocumentationService } from '../../services/construction-documentation.service';
import { FormConfig, FormFieldsComponent, ToastService } from 'ngx-dabd-grupo01';

@Component({
  selector: 'app-construction-documentation-form',
  standalone: true,
  imports: [FormFieldsComponent],
  templateUrl: './construction-documentation-form.component.html',
  styleUrl: './construction-documentation-form.component.scss',
})
export class ConstructionDocumentationFormComponent implements OnInit {
  @ViewChild(FormFieldsComponent) formFieldsComponent!: FormFieldsComponent;

  //Services
  private readonly constructionDocumentationService = inject(
    ConstructionDocumentationService
  );
  activeModal = inject(NgbActiveModal);
  private readonly toastService = inject(ToastService);

  // Properties:
  @Input() constructionId: number | undefined = undefined;
  @Input() userId: number | undefined = undefined;

  isButtonOutside: boolean = true;
  file: any;
  currentUser: number = 1;
  documentationTypes$: Observable<ConstructionDocumentationTypeResponseDTO[]> =
    this.constructionDocumentationService.documentationTypes$;

  constructionFormConfig: FormConfig = {
    formColumns: 2,
    fields: [
      {
        name: 'documentation_type_id',
        label: 'Tipo',
        type: 'select',
        options: [
          { name: '1 - Default type', value: '1' },
          { name: '2 - Second type', value: '2' },
        ],
        validations: { required: true, min: 1 },
      },
    ],
  };

  ngOnInit(): void {
    this.loadDocumentationTypes();
    this.constructionDocumentationService
      .getAllDocumentationTypes()
      .subscribe((plots) => {
        this.constructionFormConfig.fields[0].options = plots.map((plot) => {
          return {
            name: plot.id.toString() + ' - ' + plot.name,
            value: plot.id.toString(),
          };
        });
      });
  }

  loadDocumentationTypes() {
    this.constructionDocumentationService.getAllDocumentationTypes();
  }

  onSubmit = (formValue: any): void => {
    formValue.file = this.file;
    formValue.construction_id = this.constructionId;
    formValue.created_by = this.currentUser;
    this.constructionDocumentationService
      .uploadDocumentation(formValue, this.userId!)
      .subscribe({
        next: (result) => {
          this.activeModal.close(result);
          this.toastService.sendSuccess(`Se subió el documento con éxito.`);
        },
        error: (error) => {
          this.toastService.sendError('Ocurrió un error al subir la documentación.');
        },
      });
  };

  submitForm(): void {
    this.formFieldsComponent.submit();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.file = file;
  }
}
