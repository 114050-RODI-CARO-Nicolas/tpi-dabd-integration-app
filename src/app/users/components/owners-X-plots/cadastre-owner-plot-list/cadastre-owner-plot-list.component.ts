import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Owner } from '../../../models/owner';
import { OwnerPlotService } from '../../../services/owner-plot.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PlotService } from '../../../services/plot.service';
import { OwnerPlotHistoryDTO } from '../../../models/ownerXplot';
import { AsyncPipe, DatePipe, Location } from '@angular/common';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { CadastreOwnerPlotFilterButtonsComponent } from '../cadastre-owner-plot-filter-buttons/cadastre-owner-plot-filter-buttons.component';
import {
  DocumentTypeDictionary,
  OwnerTypeDictionary,
} from '../../../models/owner';
import { InfoComponent } from '../../commons/info/info.component';
import { BehaviorSubject } from 'rxjs';
import { CadastreExcelService } from '../../../services/cadastre-excel.service';

@Component({
  selector: 'app-cadastre-owner-plot-list',
  standalone: true,
  imports: [
    NgbPagination,
    FormsModule,
    MainContainerComponent,
    CadastreOwnerPlotFilterButtonsComponent,
    AsyncPipe,
  ],
  templateUrl: './cadastre-owner-plot-list.component.html',
  styleUrl: './cadastre-owner-plot-list.component.css',
  providers: [DatePipe],
})
export class CadastreOwnerPlotListComponent {
  private ownerPlotService = inject(OwnerPlotService);
  private plotService = inject(PlotService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private modalService = inject(NgbModal);
  private datePipe = inject(DatePipe);
  private toastService = inject(ToastService);
  private excelService = inject(CadastreExcelService);

  currentPage: number = 0;
  pageSize: number = 10;
  ownersList: OwnerPlotHistoryDTO[] = [];
  sizeOptions: number[] = [10, 25, 50];
  lastPage: boolean | undefined;
  totalItems: number = 0;
  plotId: number = NaN;
  title: string = 'Lista de dueños historicos del lote';
  subtitle: string = ' Manzana: '
  objectName: string = '';
  headers: string[] = [
    'Nombre',
    'Apellido',
    'Tipo Documento',
    'Document',
    'Tipo Propietario',
    'Fecha Inicio',
    'Fecha Fin',
    'Estado',
  ];
  LIMIT_32BITS_MAX = 2147483647;

  documentTypeDictionary = DocumentTypeDictionary;
  ownerTypeDictionary = OwnerTypeDictionary;
  ownerDictionaries = [this.documentTypeDictionary, this.ownerTypeDictionary];
  dictionaries: Array<{ [key: string]: any }> = [];

  private filteredOwnersList = new BehaviorSubject<OwnerPlotHistoryDTO[]>([]);
  filter$ = this.filteredOwnersList.asObservable();

  @ViewChild('filterComponent')
  filterComponent!: CadastreOwnerPlotFilterButtonsComponent<OwnerPlotHistoryDTO>;
  @ViewChild('ownersPlotTable', { static: true })
  tableName!: ElementRef<HTMLTableElement>;

  ngOnInit() {
    this.plotId = Number(this.activatedRoute.snapshot.paramMap.get('plotId'));
    this.getPlot();
    this.getOwnersByPlot();
  }

  getOwnersByPlot() {
    this.ownerPlotService
      .giveAllOwnersByPlot(this.plotId, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.ownersList = response.content;
          this.filteredOwnersList.next(response.content);
          this.lastPage = response.last;
          this.totalItems = response.totalElements;
        },
        error: (error) => {
          console.error('Error getting owners:', error);
          this.toastService.sendError(
            'Error al obtener la lista de propietarios.'
          );
        },
      });
  }

  getPlot() {
    this.plotService.getPlotById(this.plotId).subscribe(
      (response) => {
        this.subtitle += response.blockNumber + ' Nro: ' + response.plotNumber;
      },
      (error) => {
        console.error('Error getting owners:', error);
      }
    );
  }

  viewOwnerDetail(ownerId: number) {
    this.router.navigate(['/users/owner/detail/' + ownerId]);
  }

  viewPlotDetail() {
    this.router.navigate(['/users/plot/detail/' + this.plotId]);
  }

  formatDate(dateString: any | undefined) {
    const date = new Date(dateString + 'Z');
    return date ? this.datePipe.transform(date, 'dd/MM/yyyy') : '';
  }

  onItemsPerPageChange() {
    --this.currentPage;
    this.getOwnersByPlot();
  }

  onPageChange(page: number) {
    this.currentPage = --page;
    this.getOwnersByPlot();
  }

  goBack() {
    this.location.back();
  }

  openInfo() {
    const modalRef = this.modalService.open(InfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });

    modalRef.componentInstance.title = 'Lista de dueños históricos del lote';
    modalRef.componentInstance.description =
      'Esta vista lista todos los dueños históricos del lote junto con sus respectivas características.';
    modalRef.componentInstance.body = [
      {
        title: 'Datos',
        content: [
          {
            strong: 'Nombre: ',
            detail: 'Nombre completo del propietario.',
          },
          {
            strong: 'Apellido: ',
            detail: 'Apellido del propietario.',
          },
          {
            strong: 'Tipo documento: ',
            detail: 'Tipo del documento del propietario.',
          },
          {
            strong: 'N° documento: ',
            detail: 'Número del documento del propietario.',
          },
          {
            strong: 'Tipo Propietario: ',
            detail: 'Clasificación del propietario',
          },
          {
            strong: 'Fecha de Inicio: ',
            detail: 'Fecha de inicio de propiedad.',
          },
          {
            strong: 'Fecha de Fin: ',
            detail:
              'Fecha de finalización de propiedad. (Cuando el propietario vende la propiedad)',
          },
        ],
      },
      {
        title: 'Acciones',
        content: [],
      },
      {
        title: 'Funcionalidades de los botones',
        content: [
          {
            strong: 'Exportar a Excel: ',
            detail: 'Botón verde que exporta la grilla a un archivo de Excel.',
          },
          {
            strong: 'Exportar a PDF: ',
            detail: 'Botón rojo que exporta la grilla a un archivo de PDF.',
          },
          {
            strong: 'Paginación: ',
            detail: 'Botones para pasar de página en la grilla.',
          },
          {
            strong: 'Volver: ',
            detail: 'Vuelve a la vista anterior.',
          },
        ],
      },
    ];
    modalRef.componentInstance.notes = [
      'La interfaz está diseñada para ofrecer una administración eficiente de los dueños históricos del lote, manteniendo la integridad y precisión de los datos.',
    ];
  }

  /**
   * Filters the list of owners based on the input value in the text box.
   * The filter checks if any property of the owner contains the search string (case-insensitive).
   * The filtered list is then emitted through the `filterSubject`.
   *
   * @param event - The input event from the text box.
   */
  onFilterTextBoxChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    const filterValue = target.value.toLowerCase();

    let filteredList = this.ownersList.filter((owner) => {
      return Object.values(owner).some((prop) => {
        const propString = prop
          ? prop
              .toString()
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f.]/g, '')
          : '';

        const translations =
          this.ownerDictionaries && this.ownerDictionaries.length
            ? this.ownerDictionaries
                .map((dict) => this.translateDictionary(propString, dict))
                .filter(Boolean)
            : [];

        return propString.includes(filterValue);
      });
    });

    this.filteredOwnersList.next(filteredList);
  }

  /**
   * Translates a value using the provided dictionary.
   *
   * @param value - The value to translate.
   * @param dictionary - The dictionary used for translation.
   * @returns The key that matches the value in the dictionary, or undefined if no match is found.
   */
  translateDictionary(value: any, dictionary?: { [key: string]: any }) {
    if (value !== undefined && value !== null && dictionary) {
      for (const key in dictionary) {
        if (dictionary[key].toString().toLowerCase() === value.toLowerCase()) {
          return key;
        }
      }
    }
    return;
  }

  //#region Export
  // Se va a usar para los nombres de los archivos.
  getActualDayFormat() {
    const today = new Date();

    const formattedDate = today.toISOString().split('T')[0];

    return formattedDate;
  }

  dataMapper(item: Owner) {
    return [
      item['firstName'] + (item['secondName'] ? ' ' + item['secondName'] : ''),
      item['lastName'],
      this.translateDictionary(item['documentType'], this.dictionaries[0]) +
        ': ' +
        item['documentNumber'],
      this.translateDictionary(item['ownerType'], this.dictionaries[1]),
    ];
  }

  exportToPdf() {
    this.ownerPlotService
      .giveAllOwnersByPlot(this.plotId, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.excelService.exportListToPdf(
            data.content,
            `${this.getActualDayFormat()}_${this.objectName}`,
            this.headers,
            this.dataMapper
          );
        },
        error: (error) => {
          console.log(error);
        },
      });
  }

  exportToExcel() {
    this.ownerPlotService
      .giveAllOwnersByPlot(this.plotId, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.excelService.exportListToExcel(
            data.content,
            `${this.getActualDayFormat()}_${this.objectName}`
          );
        },
        error: (error) => {
          console.log(error);
        },
      });
  }
  //#end region
}
