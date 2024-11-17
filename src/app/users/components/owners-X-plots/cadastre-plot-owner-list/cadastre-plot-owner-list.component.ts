import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import {
  Plot,
  PlotStatusDictionary,
  PlotTypeDictionary,
} from '../../../models/plot';
import { OwnerPlotService } from '../../../services/owner-plot.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OwnerService } from '../../../services/owner.service';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe, DatePipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CadastrePlotOwnerFilterButtonsComponent } from '../cadastre-plot-owner-filter-buttons/cadastre-plot-owner-filter-buttons.component';
import {
  Filter,
  FilterConfigBuilder,
  MainContainerComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { InfoComponent } from '../../commons/info/info.component';
import { CadastreExcelService } from '../../../services/cadastre-excel.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-cadastre-plot-owner-list',
  standalone: true,
  imports: [
    NgbPagination,
    FormsModule,
    MainContainerComponent,
    CadastrePlotOwnerFilterButtonsComponent,
    AsyncPipe,
  ],
  templateUrl: './cadastre-plot-owner-list.component.html',
  styleUrl: './cadastre-plot-owner-list.component.css',
  providers: [DatePipe],
})
export class CadastrePlotOwnerListComponent {
  private ownerPlotService = inject(OwnerPlotService);
  private ownerService = inject(OwnerService);
  private activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  private datePipe = inject(DatePipe);
  private toastService = inject(ToastService);
  private excelService = inject(CadastreExcelService);

  filterConfig: Filter[] = new FilterConfigBuilder()
    .numberFilter('Nro. Manzana', 'plotNumber', 'Seleccione una Manzana')
    .selectFilter('Tipo', 'plotType', 'Seleccione un tipo', [
      { value: 'COMMERCIAL', label: 'Comercial' },
      { value: 'PRIVATE', label: 'Privado' },
      { value: 'COMMUNAL', label: 'Comunal' },
    ])
    .selectFilter('Estado', 'plotStatus', 'Seleccione un estado', [
      { value: 'CREATED', label: 'Creado' },
      { value: 'FOR_SALE', label: 'En Venta' },
      { value: 'SALE', label: 'Venta' },
      { value: 'SALE_PROCESS', label: 'Proceso de Venta' },
      { value: 'CONSTRUCTION_PROCESS', label: 'En construcciones' },
      { value: 'EMPTY', label: 'Vacío' },
    ])
    .radioFilter('Activo', 'isActive', [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
      { value: 'undefined', label: 'Todo' },
    ])
    .build();

  currentPage: number = 0;
  pageSize: number = 10;
  sizeOptions: number[] = [10, 25, 50];
  plotsList: Plot[] = [];
  lastPage: boolean | undefined;
  totalItems: number = 0;
  ownerId: number = NaN;
  title: string = 'Lista de lotes actuales';
  subtitle: string = ''

  ownerFirstName: string = '';
  ownerLastName: string = '';
  plotBlock: string = '';
  plotNumber: string = '';
  plotId: number | undefined = undefined;

  retrievePlotsByActive: boolean | undefined = true;

  objectName: string = '';
  headers: string[] = [
    'Manzana',
    'Lote',
    'Area Total',
    'Area Construida',
    'Tipo Lote',
    'Estado',
  ];
  LIMIT_32BITS_MAX = 2147483647;

  plotTypeDictionary = PlotTypeDictionary;
  plotStatusDictionary = PlotStatusDictionary;
  plotDictionaries = [this.plotTypeDictionary, this.plotStatusDictionary];
  dictionaries: Array<{ [key: string]: any }> = [];

  private filteredPlotList = new BehaviorSubject<Plot[]>([]);
  filter$ = this.filteredPlotList.asObservable();

  @ViewChild('filterComponent')
  filterComponent!: CadastrePlotOwnerFilterButtonsComponent<Plot>;
  @ViewChild('plotOwnersTable', { static: true })
  tableName!: ElementRef<HTMLTableElement>;

  ngOnInit() {
    this.ownerId = Number(this.activatedRoute.snapshot.paramMap.get('ownerId'));
    this.getOwnerById();
    this.getPlotsByOwner();
  }

  getPlotsByOwner() {
    this.ownerPlotService
      .giveAllPlotsByOwner(this.ownerId, this.currentPage, this.pageSize)
      .subscribe(
        (response) => {
          this.plotsList = response.content;
          this.filteredPlotList.next(response.content);
          this.lastPage = response.last;
          this.totalItems = response.totalElements;
        },
        (error) => {
          console.error('Error getting owners:', error);
        }
      );
  }

  getOwnerById() {
    this.ownerService.getOwnerById(this.ownerId).subscribe((response) => {
      this.subtitle += response.firstName + ' ' + response.lastName;
      this.ownerFirstName = response.firstName;
      this.ownerLastName = response.lastName;
    });
  }

  changePage(forward: boolean) {
    forward ? this.currentPage++ : this.currentPage--;
    this.getPlotsByOwner();
  }

  viewOwnerDetail() {
    this.router.navigate(['/users/owner/detail/' + this.ownerId]);
  }

  viewPlotDetail(plotId: number) {
    this.router.navigate(['/users/plot/detail/' + plotId]);
  }

  translateTable(value: any, dictionary: { [key: string]: any }) {
    if (value !== undefined && value !== null) {
      for (const key in dictionary) {
        if (dictionary[key] === value) {
          return key;
        }
      }
    }
    console.log('Algo salio mal.');
    return;
  }

  assignPlotToRemove(plot: Plot) {
    this.plotNumber = plot.plotNumber;
    this.plotBlock = plot.blockNumber;
    this.plotId = plot.id;
  }

  removePlot() {
    if (this.plotId !== undefined) {
      this.ownerPlotService
        .removePlot(this.plotId, this.ownerId)
        .subscribe((response) => location.reload());
    }
  }

  cleanPlotId() {
    this.plotId = undefined;
  }

  onItemsPerPageChange() {
    --this.currentPage;
    this.getPlotsByOwner();
  }

  onPageChange(page: number) {
    this.currentPage = --page;
    this.getPlotsByOwner();
  }

  goBack() {
    this.location.back();
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

    let filteredList = this.plotsList.filter((owner) => {
      return Object.values(owner).some((prop) => {
        const propString = prop
          ? prop
              .toString()
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f.]/g, '')
          : '';

        const translations =
          this.plotDictionaries && this.plotDictionaries.length
            ? this.plotDictionaries
                .map((dict) => this.translateDictionary(propString, dict))
                .filter(Boolean)
            : [];

        return propString.includes(filterValue);
      });
    });

    this.filteredPlotList.next(filteredList);
  }

  openInfo() {
    const modalRef = this.modalService.open(InfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
    });

    modalRef.componentInstance.title =
      'Lista de lotes actuales del propietario';
    modalRef.componentInstance.description =
      'Esta pantalla permite visualizar cuáles son los lotes que tiene asociado el propietario';
    modalRef.componentInstance.body = [
      {
        title: 'Datos',
        content: [
          {
            strong: 'N° de manzana:',
            detail: 'Número de manzana del lote.',
          },
          {
            strong: 'N° de lote:',
            detail: 'Número del lote.',
          },
          {
            strong: 'Área total: ',
            detail: 'Área que ocupa el lote (en metros cuadrados).',
          },
          {
            strong: 'Área construida: ',
            detail: 'Área construida dentro del lote (en metros cuadrados).',
          },
          {
            strong: 'Tipo de lote: ',
            detail: 'Clasificación del lote.',
          },
          {
            strong: 'Estado del lote: ',
            detail: 'Estado del lote.',
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
      'La interfaz está diseñada para ofrecer una administración eficiente, manteniendo la integridad y seguridad de los datos de los lotes.',
    ];
  }

  //#region Export
  // Se va a usar para los nombres de los archivos.
  getActualDayFormat() {
    const today = new Date();

    const formattedDate = today.toISOString().split('T')[0];

    return formattedDate;
  }

  dataMapper(item: Plot) {
    return [
      item['blockNumber'],
      item['plotNumber'],
      item['totalArea'],
      item['builtArea'],
      this.translateDictionary(item['plotType'], this.dictionaries[0]),
      this.translateDictionary(item['plotStatus'], this.dictionaries[1]),
      item['isActive'] ? 'Activo' : 'Inactivo',
    ];
  }

  exportToPdf() {
    this.ownerPlotService
      .giveAllPlotsByOwner(this.ownerId, this.currentPage, this.pageSize)
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
      .giveAllPlotsByOwner(this.ownerId, this.currentPage, this.pageSize)
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
  //#end region
}
