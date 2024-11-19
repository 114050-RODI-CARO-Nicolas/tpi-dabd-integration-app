import { AsyncPipe, CommonModule } from '@angular/common';
import {
  Component,
  inject,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { debounceTime, distinctUntilChanged, Observable, Subject } from 'rxjs';

import { NgbdSortableHeader, SortEvent } from './sortable.directive';
import { FormsModule } from '@angular/forms';
import {
  NgbDatepicker,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbHighlight,
  NgbModal,
  NgbPaginationModule,
} from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { FineService } from '../../services/fine.service';
import { Fine } from '../../models/fine.model';
import {
  ConfirmAlertComponent,
  MainContainerComponent,
  TableColumn,
  TableComponent,
} from 'ngx-dabd-grupo01';

import { GetValueByKeyForEnumPipe } from '../../../../../shared/pipes/get-value-by-key-for-status.pipe';
import { FineStatusEnum } from '../../models/fine-status.enum';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';

@Component({
  selector: 'app-fine-table',
  standalone: true,
  imports: [
    FormsModule,
    AsyncPipe,
    NgbHighlight,
    NgbdSortableHeader,
    NgbPaginationModule,
    CommonModule,
    NgbDatepicker,
    MainContainerComponent,
    NgbDatepickerModule,
    TableComponent,
    GetValueByKeyForEnumPipe,
    NgbDropdownModule,
  ],
  templateUrl: './fine-table.component.html',
  providers: [FineService],
})
export class FineTable {
  @ViewChild('fineState') fineStateTemplate!: TemplateRef<any>;
  @ViewChild('fineDate') fineDateTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('pdfTemplate', { static: true }) pdfTemplate!: TemplateRef<any>;
  @ViewChild('sanctionType') sanctionType!: TemplateRef<any>;
  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  columns: TableColumn[] = [];

  searchParams: { [key: string]: string | string[] | number[] | number } = {};
  searchSubject: Subject<{ key: string; value: any }> = new Subject();

  page: number = 1;
  size: number = 10;
  filterType: string = '';
  status: string = '';
  startDate: string = '';
  endDate: string = '';

  @ViewChildren(NgbdSortableHeader)
  headers!: QueryList<NgbdSortableHeader>;
  router = inject(Router);
  private = inject(NgbModal);
  FineStatusEnum = FineStatusEnum;
  fineService = inject(FineService);
  modalService = inject(NgbModal);

  items$: Observable<Fine[]> = this.fineService.items$;
  totalItems$: Observable<number> = this.fineService.totalItems$;
  isLoading$: Observable<boolean> = this.fineService.isLoading$;

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

  ngOnInit() {
    this.loadUserData();

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
        { headerName: 'Nº de multa', accessorKey: 'id' },
        { headerName: 'Lote', accessorKey: 'plot_id' },
        {
          headerName: 'Tipo',
          accessorKey: 'sanction_type.name',
          cellRenderer: this.sanctionType,
        },
        {
          headerName: 'Estado',
          accessorKey: 'type',
          cellRenderer: this.fineStateTemplate,
        },
        {
          headerName: 'Alta',
          accessorKey: 'type',
          cellRenderer: this.fineDateTemplate,
        },
        {
          headerName: 'Acciones',
          accessorKey: 'type',
          cellRenderer: this.actionsTemplate,
        },
      ];
    });
  }

  loadItems(): void {
    if (
      this.userData &&
      (this.userDataService.userHasRole(this.userData, 'FINES_ADMIN') ||
        (this.userDataService.userHasRole(this.userData, 'OWNER') && this.userData.plotIds.length !== 0))
    ) {
      this.updateFiltersAccordingToUser();
      this.fineService
        .getPaginatedFines(this.page, this.size, this.searchParams)
        .subscribe((response) => {
          this.fineService.setItems(response.items);
          this.fineService.setTotalItems(response.total);
        });
    } else {
      this.fineService.setItems([]);
      this.fineService.setTotalItems(0);
    }
  }

  updateFiltersAccordingToUser() {
    if (!this.userDataService.userHasRole(this.userData, 'FINES_ADMIN')) {
      this.searchParams = {
        ...this.searchParams,
        plotsIds: this.userData.plotIds,
      };
    } else {
      if (this.searchParams['plotsIds']) {
        delete this.searchParams['plotsIds'];
      }
    }
  }

  onFineCreated(id: number) {
    this.fineService._search$.next();
  }

  goToFineDetail(id: number) {
    this.router.navigate([`/penalties/fine/${id}/detail`]);
  }

  goToFineEdit(id: number) {
    this.router.navigate([`/penalties/fine/${id}/edit`]);
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

  getAllFines = () => {
    return this.fineService.findAll();
  };

  applyFilters(): void {
    if (this.filterType === 'fecha') {
      this.searchParams = {
        startDate: this.startDate,
        endDate: this.endDate,
      };
    } else if (this.filterType === 'estado') {
      this.searchParams = { fineState: [this.status] };
    }
    this.page = 1;
    this.loadItems();
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

  onInfoButtonClick() {
    this.modalService.open(this.infoModal, { size: 'lg' });
  }
}
