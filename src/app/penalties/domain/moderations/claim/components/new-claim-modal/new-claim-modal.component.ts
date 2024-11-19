import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClaimService } from '../../service/claim.service';
import { SanctionTypeService } from '../../../sanction-type/services/sanction-type.service';
import { SanctionType } from '../../../sanction-type/models/sanction-type.model';
import { CommonModule, NgClass } from '@angular/common';
import { ToastService } from 'ngx-dabd-grupo01';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';
import { PlotService } from '../../../../../../users/services/plot.service';
import { Plot } from '../../../../../../users/models/plot';

@Component({
  selector: 'app-new-claim-modal',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, ReactiveFormsModule],
  templateUrl: './new-claim-modal.component.html',
  styleUrl: './new-claim-modal.component.scss',
})
export class NewClaimModalComponent implements OnInit {
  //services
  private sanctionService = inject(SanctionTypeService);
  private claimService = inject(ClaimService);

  private toastService = inject(ToastService);
  private plotService = inject(PlotService);

  //variables
  sanctionTypes: SanctionType[] | undefined;
  plotId: number | undefined;
  sanctionTypeId: number | undefined;
  description: string | undefined;
  plotList: Plot[] = [];

  //variable para los archivos
  selectedFiles: File[] = [];

  // Modal logic
  closeResult = '';
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

  loadPlots() {
    this.plotService.getAllPlots(0, 100000, true).subscribe((response) => {
      if (response) {
        this.plotList = response.content;
      }
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadPlots();

    // Obtener tipos de sanción
    this.sanctionService.getSanctionTypes().subscribe({
      next: (response) => {
        this.sanctionTypes = response;
      },
      error: (error) => {
        console.error('Error fetching sanction types:', error);
      },
    });
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
  submitClaim() {
    if (
      this.plotId &&
      this.sanctionTypeId &&
      this.description &&
      this.imageForm.valid
    ) {
      const formData = new FormData();
      formData.append('plot_id', this.plotId.toString());
      formData.append(
        'sanction_type_entity_id',
        this.sanctionTypeId.toString()
      );
      formData.append('description', this.description);

      // Agregar archivos seleccionados
      this.selectedFiles.forEach((file, index) => {
        formData.append(`files`, file, file.name);
      });

      // Agregar imagen capturada si existe
      const capturedImage = this.imageForm.get('image')?.value;
      if (capturedImage) {
        const imageBlob = this.dataURItoBlob(capturedImage);
        formData.append('files', imageBlob, 'captured-image.png');
      }

      this.claimService.createClaim(formData).subscribe({
        next: (response) => {
          this.activeModal.close(response);
          this.toastService.sendSuccess(
            'Se creó el reclamo ' + response.id + '.'
          );

          console.log('Reclamo creado con éxito', response);
        },
        error: (error) => {
          this.toastService.sendError('Error creando el reclamo.');

          console.error('Error al crear el reclamo:', error);
        },
      });
    } else {
      console.error('Faltan datos obligatorios en el formulario');
    }
  }

  // Método para convertir data URI a Blob
  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;

  private stream: MediaStream | null = null;

  imageForm: FormGroup;
  isCameraOpen = false;
  isFrontCamera: boolean = true;
  capturedImage: string | null = null;

  constructor(private fb: FormBuilder) {
    this.imageForm = this.fb.group({
      image: [null],
    });
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.capturedImage = reader.result as string;
        this.imageForm.patchValue({ image: file });
      };
      reader.readAsDataURL(file);
    }
  }

  async startCamera(): Promise<void> {
    try {
      this.isCameraOpen = true;
      const constraints = {
        video: {
          facingMode: this.isFrontCamera ? 'user' : 'environment',
        },
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoPreview.nativeElement.srcObject = this.stream;
    } catch (error) {
      console.error('Error al acceder a la cámara: ', error);
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.isCameraOpen = false;
      this.stream = null;
    }
  }

  capturePhoto(): void {
    if (this.stream) {
      const video = this.videoPreview.nativeElement;
      const canvas = document.createElement('canvas');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        this.capturedImage = canvas.toDataURL('image/png');
        this.imageForm.patchValue({ image: this.capturedImage });
      }

      this.stopCamera();
    }
  }

  toggleCamera() {
    this.isFrontCamera = !this.isFrontCamera;
    this.stopCamera();
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  removeCapturedImage(): void {
    this.capturedImage = null;
    this.imageForm.patchValue({ image: null });
  }
}
