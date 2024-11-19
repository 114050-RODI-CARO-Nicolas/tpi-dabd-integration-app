import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { SanctionTypeService } from '../../services/sanction-type.service';
import { debounceTime, distinctUntilChanged, Observable, Subject } from 'rxjs';
import { ChargeTypeEnum, SanctionType } from '../../models/sanction-type.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SanctionTypeFormComponent } from '../sanction-type-form/sanction-type-form.component';
import { GetValueByKeyForEnumPipe } from '../../../../../shared/pipes/get-value-by-key-for-status.pipe';
import { TruncatePipe } from '../../../../../shared/pipes/truncate.pipe';
import {
  ConfirmAlertComponent,
  MainContainerComponent,
  TableColumn,
  TableComponent,
} from 'ngx-dabd-grupo01';
import {
  UserDataService,
  UserData,
} from '../../../../../shared/services/user-data.service';
import { AppealDaysFormComponent } from '../appeal-days-form/appeal-days-form.component';

@Component({
  selector: 'app-sanction-type-list',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    MainContainerComponent,
    GetValueByKeyForEnumPipe,
    TruncatePipe,
    AppealDaysFormComponent,
  ],
  templateUrl: './sanction-type-list.component.html',
  styleUrl: './sanction-type-list.component.scss',
})
export class SanctionTypeListComponent {
  // Services:
  private readonly router = inject(Router);
  private sanctionTypeService = inject(SanctionTypeService);
  private modalService = inject(NgbModal);
  ChargeTypeEnum = ChargeTypeEnum;

  // Properties:
  items$: Observable<SanctionType[]> = this.sanctionTypeService.items$;
  totalItems$: Observable<number> = this.sanctionTypeService.totalItems$;
  isLoading$: Observable<boolean> = this.sanctionTypeService.isLoading$;
  searchSubject: Subject<{ key: string; value: any }> = new Subject();

  page: number = 1;
  size: number = 10;
  searchParams: { [key: string]: string } = {};

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('chargeType') chargeType!: TemplateRef<any>;
  @ViewChild('description') description!: TemplateRef<any>;

  columns: TableColumn[] = [];

  userDataService = inject(UserDataService);
  userData!: UserData;

  loadUserData() {
    this.userDataService.loadNecessaryData().subscribe((response) => {
      if (response) {
        this.userData = response;
      }
    });
  }

  // Methods:
  ngOnInit(): void {
    this.loadUserData();

    this.searchSubject
      .pipe(
        debounceTime(200), // Espera 200 ms después de la última emisión
        distinctUntilChanged() // Solo emite si el valor es diferente al anterior
      )
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
        { headerName: 'N.°', accessorKey: 'id' },
        { headerName: 'Nombre', accessorKey: 'name' },
        {
          headerName: 'Descripción',
          accessorKey: 'description',
          cellRenderer: this.description,
        },
        {
          headerName: 'Cobro',
          accessorKey: 'charge_type',
          cellRenderer: this.chargeType,
        },
        { headerName: 'Monto', accessorKey: 'amount' },
        {
          headerName: 'Acciones',
          accessorKey: 'actions',
          cellRenderer: this.actionsTemplate,
        },
      ];
    });
  }

  loadItems(): void {
    this.sanctionTypeService
      .getPaginatedSanctionTypes(this.page, this.size, this.searchParams)
      .subscribe((response) => {
        this.sanctionTypeService.setItems(response.items);
        this.sanctionTypeService.setTotalItems(response.total);
      });
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

  goToDetails = (id: number, mode: string): void => {
    this.router.navigate(['penalties/sanctionType', id, mode]);
  };

  openFormModal(sanctionTypeToEdit: number | null = null): void {
    const modalRef = this.modalService.open(SanctionTypeFormComponent);
    modalRef.componentInstance.sanctionTypeToEdit = sanctionTypeToEdit;
  }
  infoModal() {
    const modalRef = this.modalService.open(ConfirmAlertComponent);
    modalRef.componentInstance.alertType = 'info';

    modalRef.componentInstance.alertTitle = 'Ayuda';
    modalRef.componentInstance.alertMessage = `Aquí podrás consultar los tipos de sanciones y sus criterios para ser aplicados. \n Considerá que los costos pueden ser fijos o variables y la cantidad de infracciones que generan una multa dependen del tipo. `;
  }
}
