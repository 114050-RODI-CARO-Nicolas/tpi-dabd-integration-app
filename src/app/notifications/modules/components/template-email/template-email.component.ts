import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  inject,
  ViewChild,
} from '@angular/core';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { TemplateService } from '../../../services/template.service';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  NgForm,
  NgModel,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TemplateModel } from '../../../models/templates/templateModel';
import { HttpErrorResponse } from '@angular/common/http';
import { IaService } from '../../../services/ia-service';
import { response } from 'express';
import { error, log } from 'console';

@Component({
  selector: 'app-template-email',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MainContainerComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './template-email.component.html',
  styleUrl: './template-email.component.css',
})
@Inject('TemplateService')
@Inject('HtmlValidationService')
@Inject('IaService')
export class TemplateEmailComponent {
  modalTitle: string = '';
  modalMessage: string = '';
  isModalOpen = false;
  isIaModalOpen = false;
  iaInputText = '';
  iaResponse: String = '';
  isLoadingIA: boolean = false;
  previewVisible: boolean = false;
  showModalToRenderHTML: boolean = false;
  @ViewChild('iframePreview') iframePreview!: ElementRef;
  @ViewChild('iaTemplateBodyModel') iaTemplateBodyModel!: NgModel;
    
  constructor(private cdr: ChangeDetectorRef) {}
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
  form: FormGroup = new FormGroup({
    templateName: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
    ]),
    templateBody: new FormControl('', [
      Validators.required,
      Validators.minLength(100),
      this.isValidHTML(),
    ]),
  });

  template: TemplateModel = {
    id: 0,
    name: '',
    body: '',
    active: true,
  };

  templateService: TemplateService = new TemplateService();
  toastService: ToastService = inject(ToastService);
  iaService: IaService = new IaService();

  // Formulario reactivo
  public async sendForm() {
    const templateBodyControl = this.form.get('templateBody');
    templateBodyControl?.updateValueAndValidity();

    if (this.form.valid) {
  
      return await this.sendEmailTemplate(
        this.form.get('templateName')?.value,
        this.form.get('templateBody')?.value
      );
      
    }
  }

  async sendEmailTemplate(templateName: string, templateBody: string) {
    this.template.name = templateName;
    this.template.body = templateBody;

    this.templateService.sendTemplate(this.template).subscribe({
      next: (response) => {
        this.toastService.sendSuccess('Plantilla guardada correctamente');
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.sendError('Hubo un error guardando la plantilla');
        console.error('Error al enviar el template:', error);
      },
    });
  }

  openModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.classList.remove('modal-open');
  }

  resetForm() {
    this.form.reset({
      templateName: '',
      templateBody: '',
    });
  }

  isValidHTML(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const html = control.value;

      if (!html) {
        return null; // No hay valor, no se aplica la validación
      }
      // Verifica si contiene al menos una etiqueta HTML básica
      const regex = /<\/?[a-z][\s\S]*>/i; // Expresión regular básica para detectar etiquetas HTML
      const isHTML = regex.test(html);

      if (!isHTML) {
        return { invalidHtml: true }; // Si no es un HTML válido
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const isValid = !doc.getElementsByTagName('parsererror').length; // Verifica si hay errores

      return isValid ? null : { invalidHtml: true }; // Retorna un objeto de error si es inválido
    };
  }

  openIaModal() {
    this.isIaModalOpen = true;
    const iaTemplateBodyControl = document.getElementById('iaTemplateBodyModel');
    if (iaTemplateBodyControl) {
      iaTemplateBodyControl.classList.remove('ng-dirty', 'ng-touched', 'is-invalid', 'is-valid');
    }
  }

  closeIaModal() {
    this.iaInputText = '';
    this.iaResponse = '';
    this.isIaModalOpen = false;  // Restablece el estado del modelo
    if (this.iaTemplateBodyModel) {
      this.iaTemplateBodyModel.control.markAsPristine(); // Limpia dirty
      this.iaTemplateBodyModel.control.markAsUntouched(); // Limpia touched
      this.iaTemplateBodyModel.control.updateValueAndValidity(); // Actualiza validaciones
    }
  }

  sendToIa() {
    this.isLoadingIA = true;
    this.iaService.askTemplateToAI(this.iaInputText).subscribe({
      next: (response) => {
        this.iaResponse = response;
        this.isLoadingIA = false;
      },
      error: (error) => {
        console.error('Error de IA:', error);
        this.toastService.sendError(error);
        this.isLoadingIA = false;
      },
    });
  }

  sendBodyIa() {
    // this.templateBodyModal = this.iaResponse.toString();
    

    this.form.patchValue({
      templateBody: this.iaResponse.toString(),
    });
  
    this.form.get('templateBody')?.markAsDirty();
    this.form.get('templateBody')?.markAsTouched();
  
    this.closeIaModal();
  }

  openPreviewModal() {
    if (this.isValidHtml(this.iaResponse.toString())) {
      this.previewVisible = true;
    } else {
      this.toastService.sendError(
        'El HTML no es válido para la previsualización.'
      );
    }
  }

  isValidHtml(html: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return !doc.getElementsByTagName('parsererror').length;
  }

  previewContent(): void {
    this.showModalToRenderHTML = true;
    setTimeout(() => {
      const iframe = this.iframePreview.nativeElement as HTMLIFrameElement;
      console.log(this.iframePreview.nativeElement);
      iframe.srcdoc = this.iaResponse.toString(); // Asigna la respuesta de la IA al iframe
      iframe.onload = () => {
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          const height = iframeDocument.documentElement.scrollHeight;
          iframe.style.height = `${height}px`; // Ajusta la altura del iframe
        }
      };
    }, 5);
  }

  closeModalToRenderHTML(): void {
    this.showModalToRenderHTML = false;
  }

  showInfo() {
    const message = '';

    this.showModal('Información', message);
  }

  showModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }
}
