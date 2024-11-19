import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { NewInfractionModalComponent } from '../new-infraction-modal/new-infraction-modal.component';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  InfractionResponseDTO,
  InfractionStatusEnum,
} from '../../models/infraction.model';
import { InfractionServiceService } from '../../services/infraction-service.service';
import {
  Filter,
  FilterConfigBuilder,
  MainContainerComponent,
  TableColumn,
  TableComponent,
} from 'ngx-dabd-grupo01';
import { FormsModule } from '@angular/forms';
import { GetValueByKeyForEnumPipe } from '../../../../../shared/pipes/get-value-by-key-for-status.pipe';
import { Router } from '@angular/router';
import { ConfirmAlertComponent } from 'ngx-dabd-grupo01';
import { InfractionBadgeService } from '../../services/infraction-badge.service';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';

@Component({
  selector: 'app-infraction-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NewInfractionModalComponent,
    MainContainerComponent,
    TableComponent,
    NgbDropdownModule,
    GetValueByKeyForEnumPipe,
  ],
  templateUrl: './infraction-list.component.html',
  styleUrl: './infraction-list.component.scss',
})
export class InfractionListComponent {
  // Services:
  private infractionService = inject(InfractionServiceService);
  private modalService = inject(NgbModal);
  private router = inject(Router);
  private infractionBadgeService = inject(InfractionBadgeService);

  // Properties:
  items$: Observable<InfractionResponseDTO[]> = this.infractionService.items$;
  totalItems$: Observable<number> = this.infractionService.totalItems$;
  isLoading$: Observable<boolean> = this.infractionService.isLoading$;

  InfractionStatusEnum = InfractionStatusEnum;

  page: number = 1;
  size: number = 10;
  searchParams: { [key: string]: any | any[] } = {};

  // Filtro dinámico
  filterType: string = '';
  startDate: string = '';
  endDate: string = '';
  status: string = '';

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('fineTemplate') fineTemplate!: TemplateRef<any>;
  @ViewChild('sanctionType') sanctionType!: TemplateRef<any>;
  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  columns: TableColumn[] = [];

  userDataService = inject(UserDataService);
  userData!: UserData;

  loadUserData() {
    this.userDataService.loadNecessaryData().subscribe((response) => {
      if (response) {
        this.userData = response;
        this.loadItems();
      }
    });
  }

  // Methods:
  ngOnInit(): void {
    this.loadUserData();
    this.loadItems();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.columns = [
        { headerName: 'N.° Infracción', accessorKey: 'id' },
        {
          headerName: 'Alta',
          accessorKey: 'created_date',
          cellRenderer: this.dateTemplate,
        },
        {
          headerName: 'Tipo',
          accessorKey: 'sanction_type.name',
          cellRenderer: this.sanctionType,
        },
        { headerName: 'Descripción', accessorKey: 'description' },
        {
          headerName: 'N.° Multa',
          accessorKey: 'fine_id',
          cellRenderer: this.fineTemplate,
        },
        {
          headerName: 'Estado',
          accessorKey: 'infraction_state',
          cellRenderer: this.statusTemplate,
        },
        { headerName: 'Lote', accessorKey: 'plot_id' },
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
      this.infractionService
        .getAllInfractions(this.page, this.size, this.searchParams)
        .subscribe((response) => {
          this.infractionService.setItems(response.items);
          this.infractionService.setTotalItems(response.total);

          const infractionsToSolve = response.items.filter(
            (item) => item.infraction_status.toString() === 'CREATED'
          ).length;

          this.infractionBadgeService.updateInfractionsCount(
            infractionsToSolve
          );
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
    const modalRef = this.modalService.open(NewInfractionModalComponent);
    modalRef.componentInstance.itemId = itemId;
    modalRef.componentInstance.userId = this.userData.id;

    modalRef.result
      .then((result) => {
        if (result) {
          this.loadItems();
        }
      })
      .catch(() => {});
  }

  setFilterType(type: string): void {
    this.filterType = type;
  }

  onFilterValueChange(filters: Record<string, any>) {
    this.searchParams = {
      ...filters,
    };

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
    // .selectFilter('Estado', 'constructionStatuses', 'Seleccione el Estado', [
    //   { value: 'LOADING', label: 'En proceso de carga' },
    //   { value: 'REJECTED', label: 'Rechazado' },
    //   { value: 'APPROVED', label: 'Aprobado' },
    //   { value: 'COMPLETED', label: 'Finalizadas' },
    //   { value: 'IN_PROGRESS', label: 'En progreso' },
    //   { value: 'ON_REVISION', label: 'En revisión' },
    // ])
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

  goToDetails(id: number) {
    this.router.navigate(['/penalties/infraction', id]);
  }

  updateFiltersAccordingToUser() {
    if (!this.userDataService.userHasRole(this.userData, 'FINES_ADMIN')) {
      this.searchParams = {
        ...this.searchParams,
        plotsIds: this.userData?.plotIds,
        userId: this.userData?.id,
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

  getAllItems = (): Observable<any> => {
    return this.infractionService.getAllItems(1, 1000);
  };
}
