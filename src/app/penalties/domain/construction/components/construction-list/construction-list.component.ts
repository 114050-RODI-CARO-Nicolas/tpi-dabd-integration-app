import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import {
  CONSTRUCTION_STATUSES_ENUM,
  ConstructionResponseDto,
} from '../../models/construction.model';
import { ConstructionFormComponent } from '../construction-form/construction-form.component';
import { ConstructionService } from '../../services/construction.service';
import { Router } from '@angular/router';
import {
  ConfirmAlertComponent,
  Filter,
  FilterConfigBuilder,
  MainContainerComponent,
  SidebarComponent,
  TableColumn,
  TableComponent,
  TableFiltersComponent,
} from 'ngx-dabd-grupo01';
import { FormsModule } from '@angular/forms';
import { GetValueByKeyForEnumPipe } from '../../../../shared/pipes/get-value-by-key-for-status.pipe';
import {
  UserDataService,
  UserData,
} from '../../../../shared/services/user-data.service';

@Component({
  selector: 'app-construction-list',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    TableComponent,
    MainContainerComponent,
    NgbDropdownModule,
    GetValueByKeyForEnumPipe,
    SidebarComponent,
    TableFiltersComponent,
  ],
  templateUrl: './construction-list.component.html',
  styleUrl: './construction-list.component.css',
})
export class ConstructionListComponent {
  // Services:
  private readonly router = inject(Router);

  private constructionService = inject(ConstructionService);
  private modalService = inject(NgbModal);
  userDataService = inject(UserDataService);
  userData!: UserData;

  // Properties:
  CONSTRUCTION_STATUSES_ENUM = CONSTRUCTION_STATUSES_ENUM;

  items$: Observable<ConstructionResponseDto[]> =
    this.constructionService.items$;
  totalItems$: Observable<number> = this.constructionService.totalItems$;
  isLoading$: Observable<boolean> = this.constructionService.isLoading$;

  page: number = 1;
  size: number = 10;
  searchParams: { [key: string]: any } = {};

  // Filtro dinámico
  filterType: string = '';
  startDate: string = '';
  endDate: string = '';
  status: string = '';

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  columns: TableColumn[] = [];

  // Methods:
  updateFiltersAccordingToUser() {
    if (this.userData) {
      if (!this.userDataService.userHasRole(this.userData, 'CONSTRUCTION_ADMIN')) {
        this.searchParams = {
          ...this.searchParams,
          plotsIds: this.userData.plotIds,
          userId: this.userData.id,
        };
      } else {
        if (this.searchParams['userId']) {
          delete this.searchParams['userId'];
        }
        if (this.searchParams['plotsIds']) {
          delete this.searchParams['plotsIds'];
        }
      }
    }
  }

  loadUserData() {
    this.userDataService.loadNecessaryData().subscribe((response) => {
      if (response) {
        this.userData = response;
        this.loadItems();
      }
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadItems();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.columns = [
        { headerName: 'N.° Construcción', accessorKey: 'construction_id' },
        { headerName: 'Descripción', accessorKey: 'project_description' },
        { headerName: 'Lote', accessorKey: 'plot_id' },
        { headerName: 'Inicio', accessorKey: 'planned_start_date' },
        { headerName: 'Finalización', accessorKey: 'planned_end_date' },
        { headerName: 'Nombre', accessorKey: 'project_name' },
        { headerName: 'Dirección', accessorKey: 'project_address' },
        {
          headerName: 'Estado',
          accessorKey: 'construction_status',
          cellRenderer: this.statusTemplate,
        },
        {
          headerName: 'Acciones',
          cellRenderer: this.actionsTemplate,
        },
      ];
    });
  }

  loadItems(): void {
    if (this.userData) {
      this.updateFiltersAccordingToUser();
      this.constructionService
        .getAllConstructions(this.page, this.size, this.searchParams)
        .subscribe((response) => {
          this.constructionService.setItems(response.items);
          this.constructionService.setTotalItems(response.total);
        });
    }
  }

  onPageChange = (page: number): void => {
    this.page = page;
    this.loadItems();
  };

  onPageSizeChange = (size: number): void => {
    this.size = size;
    this.loadItems();
  };

  onSearchValueChange = (searchValue: any): void => {
    this.searchParams = { searchValue };
    this.page = 1;
    this.loadItems();
  };

  openFormModal(itemId: number | null = null): void {
    const modalRef = this.modalService.open(ConstructionFormComponent);
    modalRef.componentInstance.itemId = itemId;
  }

  goToDetails = (id: number, mode: 'detail' | 'edit'): void => {
    this.router.navigate(['penalties/constructions', id, mode]);
  };

  setFilterType(type: string): void {
    this.filterType = type;
  }

  applyFilters(): void {
    if (this.filterType === 'fecha') {
      this.searchParams = {
        startDate: this.startDate,
        endDate: this.endDate,
      };
    } else if (this.filterType === 'estado') {
      this.searchParams = { constructionStatuses: [this.status] };
    }
    this.page = 1;
    this.loadItems();
  }

  clearFilters(): void {
    this.filterType = '';
    this.startDate = '';
    this.endDate = '';
    this.status = '';
    this.searchParams = {};
    this.loadItems();
  }
  onInfoButtonClick() {
    this.modalService.open(this.infoModal, { size: 'lg' });
  }

  filterConfig: Filter[] = new FilterConfigBuilder()
    .selectFilter('Estado', 'constructionStatuses', 'Seleccione el Estado', [
      { value: 'LOADING', label: 'En proceso de carga' },
      { value: 'REJECTED', label: 'Rechazado' },
      { value: 'APPROVED', label: 'Aprobado' },
      { value: 'COMPLETED', label: 'Finalizadas' },
      { value: 'IN_PROGRESS', label: 'En progreso' },
      { value: 'ON_REVISION', label: 'En revisión' },
    ])
    .dateFilter(
      'Fecha desde',
      'startDate',
      'Placeholder',
      "yyyy-MM-dd'T'HH:mm:ss"
    )
    .dateFilter(
      'Fecha hasta',
      'endDate',
      'Placeholder',
      "yyyy-MM-dd'T'HH:mm:ss"
    )
    .build();

  onFilterValueChange(filters: Record<string, any>) {
    this.searchParams = {
      ...filters,
    };

    this.page = 1;
    this.loadItems();
  }

  getAllItems = (): Observable<any> => {
    return this.constructionService.getAllItems();
  };
}
