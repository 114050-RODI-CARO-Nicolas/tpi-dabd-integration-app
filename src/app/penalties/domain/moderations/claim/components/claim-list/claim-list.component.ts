import {
  Component,
  inject,
  TemplateRef,
  ViewChild,
  ɵɵsetComponentScope,
} from '@angular/core';
import { NewClaimModalComponent } from '../new-claim-modal/new-claim-modal.component';
import { Router } from '@angular/router';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, Observable, Subject } from 'rxjs';
import {
  ConfirmAlertComponent,
  MainContainerComponent,
  TableColumn,
  TableComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { CommonModule } from '@angular/common';
import { GetValueByKeyForEnumPipe } from '../../../../../shared/pipes/get-value-by-key-for-status.pipe';
import { TruncatePipe } from '../../../../../shared/pipes/truncate.pipe';
import { ClaimService } from '../../service/claim.service';
import { ClaimDTO, ClaimStatusEnum } from '../../models/claim.model';
import { NewInfractionModalComponent } from '../../../infraction/components/new-infraction-modal/new-infraction-modal.component';
import { FormsModule } from '@angular/forms';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [
    NewClaimModalComponent,
    CommonModule,
    TableComponent,
    MainContainerComponent,
    GetValueByKeyForEnumPipe,
    TruncatePipe,
    NgbDropdownModule,
    FormsModule,
  ],
  templateUrl: './claim-list.component.html',
  styleUrl: './claim-list.component.scss',
})
export class ClaimListComponent {
  // Services:
  private readonly router = inject(Router);
  private claimService = inject(ClaimService);
  private modalService = inject(NgbModal);
  private readonly toastService = inject(ToastService);

  ClaimStatusEnum = ClaimStatusEnum;

  // Properties:
  items$: Observable<ClaimDTO[]> = this.claimService.items$;
  totalItems$: Observable<number> = this.claimService.totalItems$;
  isLoading$: Observable<boolean> = this.claimService.isLoading$;
  searchSubject: Subject<{ key: string; value: any }> = new Subject();
  checkedClaims: ClaimDTO[] = [];
  claimStatusKeys: string[] = [];

  page: number = 1;
  size: number = 10;
  filterType: string = '';
  status: string = '';
  startDate: string = '';
  endDate: string = '';
  searchParams: { [key: string]: string | string[] | number[] | number } = {};

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('description') description!: TemplateRef<any>;
  @ViewChild('sanctionType') sanctionType!: TemplateRef<any>;
  @ViewChild('date') date!: TemplateRef<any>;
  @ViewChild('claimStatus') claimStatus!: TemplateRef<any>;
  @ViewChild('infraction') infraction!: TemplateRef<any>;
  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  @ViewChild('check') check!: TemplateRef<any>;

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

    this.claimStatusKeys = Object.keys(ClaimStatusEnum) as Array<
      keyof typeof ClaimStatusEnum
    >;
    this.searchSubject
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(({ key, value }) => {
        this.searchParams = { [key]: value };
        this.page = 1;
        this.loadItems();
      });

    this.loadItems();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.columns = [
        {
          headerName: 'Nº. Reclamo',
          accessorKey: 'id',
          cellRenderer: this.check,
        },
        {
          headerName: 'Alta',
          accessorKey: 'sanction_type.created_date',
          cellRenderer: this.date,
        },
        { headerName: 'Lote', accessorKey: 'plot_id' },
        {
          headerName: 'Tipo',
          accessorKey: 'sanction_type.name',
          cellRenderer: this.sanctionType,
        },

        {
          headerName: 'Descripción',
          accessorKey: 'description',
          cellRenderer: this.description,
        },
        {
          headerName: 'Estado',
          accessorKey: 'description',
          cellRenderer: this.claimStatus,
        },
        {
          headerName: 'Infracción',
          accessorKey: 'description',
          cellRenderer: this.infraction,
        },
        {
          headerName: 'Acciones',
          cellRenderer: this.actionsTemplate,
        },
      ];
    });
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

  loadItems(): void {
    if (this.userData) {
      this.updateFiltersAccordingToUser();
      this.claimService
        .getPaginatedClaims(this.page, this.size, this.searchParams)
        .subscribe((response) => {
          this.claimService.setItems(response.items);
          this.claimService.setTotalItems(response.total);
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

  onSearchValueChange = (key: string, searchValue: any): void => {
    this.searchSubject.next({ key, value: searchValue });
  };

  goToDetails = (id: number, mode: 'detail' | 'edit'): void => {
    this.router.navigate(['penalties/claim', id, mode]);
  };

  openFormModal(sanctionTypeToEdit: number | null = null): void {
    if (this.checkedClaims.length !== 0) {
      this.openCreateInfractionModal();
    } else {
      this.openNewCaimModal();
    }
  }

  openNewCaimModal() {
    const modalRef = this.modalService.open(NewClaimModalComponent);
    modalRef.result
      .then((result) => {
        if (result) {
          this.loadItems();
        }
      })
      .catch(() => {});
  }

  checkClaim(claim: ClaimDTO): void {
    const index = this.checkedClaims.indexOf(claim);

    if (index !== -1) {
      this.checkedClaims.splice(index, 1);
    } else {
      this.checkedClaims.push(claim);
    }
  }

  disbledCheck(claim: ClaimDTO): boolean {
    if (this.checkedClaims.length == 0) {
      return false;
    }
    if (this.checkedClaims[0].sanction_type.id != claim.sanction_type.id) {
      return true;
    }
    if (this.checkedClaims[0].plot_id !== claim.plot_id) {
      return true;
    }

    return false;
  }

  includesClaimById(claim: ClaimDTO): boolean {
    return this.checkedClaims.some((c) => c.id === claim.id);
  }

  openCreateInfractionModal(): void {
    const modalRef = this.modalService.open(NewInfractionModalComponent);
    modalRef.componentInstance.claims = this.checkedClaims;
    modalRef.componentInstance.sanctionTypeNumber =
      this.checkedClaims[0].sanction_type.id;
    modalRef.componentInstance.plotId = this.checkedClaims[0].plot_id;
    modalRef.componentInstance.userId = this.userData.id;

    modalRef.result
      .then((result) => {
        if (result) {
          this.loadItems();
          this.checkedClaims = [];
        }
      })
      .catch(() => {});
  }

  setFilterType(type: string): void {
    this.filterType = type;
  }

  clearFilters(): void {
    this.filterType = '';
    this.startDate = '';
    this.endDate = '';
    this.status = '';
    this.searchParams = {};
    this.loadItems();
  }

  applyFilters(): void {
    if (this.filterType === 'fecha') {
      this.searchParams = {
        startDate: this.startDate,
        endDate: this.endDate,
      };
    } else if (this.filterType === 'estado') {
      this.searchParams = { claimStatus: [this.status] };
    }
    this.page = 1;
    this.loadItems();
  }
  onInfoButtonClick() {
    this.modalService.open(this.infoModal, { size: 'lg' });
  }

  disapproveClaim(claimId: number) {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertTitle = 'Confirmación';
    modalRef.componentInstance.alertMessage = `¿Estás seguro de que desea desaprobar el reclamo?`;

    modalRef.result.then((result) => {
      if (result) {
        this.claimService
          .disapproveClaim(claimId, this.userData.id!)
          .subscribe({
            next: () => {
              this.toastService.sendSuccess(
                `Reclamo desaprobado exitosamente.`
              );
              this.loadItems();
            },
            error: () => {
              this.toastService.sendError(`Error desaprobando reclamo.`);
            },
          });
      }
    });
  }

  getAllItems = (): Observable<any> => {
    return this.claimService.getAllItems(1, 1000);
  };
}
