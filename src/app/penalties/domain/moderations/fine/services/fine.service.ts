import { inject, Injectable } from '@angular/core';

import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';

import {
  catchError,
  debounceTime,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Fine } from '../models/fine.model';
import { FineStatusEnum } from '../models/fine-status.enum';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Page } from '../../../../shared/models/page.model';
import { FineDTO } from '../models/fine-dto.model';
import { UpdateFineStateDTO } from '../models/update-fine-status-dto';
import {
  SortColumn,
  SortDirection,
} from '../components/fine-table/sortable.directive';
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';
import { ExcelExportService } from 'ngx-dabd-grupo01';
import { ClaimDTO } from '../../claim/models/claim.model';
import { environment } from '../../../../../../environments/environment';
import { UserDataService } from '../../../../shared/services/user-data.service';

interface SearchResult {
  fines: Fine[];
  total: number;
}

interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  searchState: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  dateFrom: any;
  dateTo: any;
}

@Injectable({ providedIn: 'root' })
export class FineService {
  private excelService = inject(ExcelExportService);
  datePipe = inject(DatePipe);
  userDataService = inject(UserDataService);

  private _loading$ = new BehaviorSubject<boolean>(true);
  public _search$ = new Subject<void>();
  private _fines$ = new BehaviorSubject<Fine[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private apiUrl = environment.apis.moderations.slice(0, -1);

  private _state: State = {
    page: 1,
    pageSize: 10,
    searchTerm: '',
    searchState: '',
    sortColumn: '',
    sortDirection: '',
    dateFrom: null,
    dateTo: null,
  };

  constructor(private http: HttpClient) {
    // Extraemos las claves del enumerado como un array tipado
    this.fineStatusKeys = Object.keys(this.FineStatusEnum) as Array<
      keyof typeof FineStatusEnum
    >;
  }

  FineStatusEnum = FineStatusEnum;
  fineStatusKeys: string[] = [];

  private itemsSubject = new BehaviorSubject<Fine[]>([]);
  items$ = this.itemsSubject.asObservable();

  private totalItemsSubject = new BehaviorSubject<number>(0);
  totalItems$ = this.totalItemsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private oneClaim = new BehaviorSubject<Fine | undefined>(undefined);
  oneClaim$ = this.oneClaim.asObservable();

  setItems(items: Fine[]): void {
    this.itemsSubject.next(items);
  }

  setTotalItems(total: number): void {
    this.totalItemsSubject.next(total);
  }

  public findAll(searchParams: any = {}): Observable<Fine[]> {
    let params = new HttpParams();
    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key]) {
        if (Array.isArray(searchParams[key])) {
          searchParams[key].forEach((value) => {
            params = params.append(key, value.toString());
          });
        } else {
          params = params.set(key, searchParams[key].toString());
        }
      }
    });

    return this.http.get<Fine[]>(`${this.apiUrl}/fine`, { params }).pipe(
      map((data) => data),
      catchError((error) => {
        return throwError(
          () => new Error('Error fetching fines, please try again later.')
        );
      })
    );
  }

  getFineById(id: number) {
    return this.http.get<Fine>(`${this.apiUrl}/fine/${id}`);
  }

  updateState(fine: UpdateFineStateDTO, fineId: number): Observable<Fine> {
    return this.http
      .put<Fine>(`${this.apiUrl}/fine/${fineId}/state`, fine, {
        headers: this.userDataService.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error en la solicitud de edición de multa:', error);
          return throwError(() => new Error('Error en la edición de la multa'));
        })
      );
  }

  getValueByKeyForStatusEnum(value: string) {
    return Object.entries(FineStatusEnum).find(
      ([key, val]) => key === value
    )?.[1];
  }

  downloadPdfDetail(fine: Fine) {
    const doc = new jsPDF();

    // Datos del formulario
    const formLabels = ['Lote:', 'Tipo:', 'Alta:', 'Estado:'];
    const formValues = [
      fine.plot_id.toString(),
      fine.sanction_type.name,
      this.datePipe.transform(fine.created_date, 'dd/MM/yyyy HH:mm'),
      this.getValueByKeyForStatusEnum(fine.fine_state),
    ];

    // Estilo del formulario
    const startX = 10;
    const startY = 20;
    const rowHeight = 10;
    const colWidth = 80;

    // Dibujar formulario
    formLabels.forEach((label, index) => {
      const x = startX + (index % 2) * colWidth;
      const y = startY + Math.floor(index / 2) * rowHeight;
      doc.text(label, x, y);
      if (formValues[index]) doc.text(formValues[index], x + 40, y); // Desplazamiento para el valor
    });

    // Separador
    doc.setLineWidth(0.5);
    doc.line(startX, startY + 30, 200, startY + 30); // Línea horizontal

    // Datos de la tabla de infracciones
    const headers = ['ID', 'Usuario', 'Fecha de Alta'];
    const infractions = [
      { id: 1, user: 'Juan', date: '01/01/2023' },
      { id: 2, user: 'Ana', date: '02/01/2023' },
      { id: 3, user: 'Luis', date: '03/01/2023' },
    ];

    // Estilo de la tabla
    const tableStartY = startY + 40;
    const tableRowHeight = 10;

    // Dibujar encabezados de la tabla
    headers.forEach((header, index) => {
      doc.text(header, startX + index * 60, tableStartY);
    });

    // Dibujar datos de infracciones
    infractions.forEach((infraction, rowIndex) => {
      doc.text(
        infraction.id.toString(),
        startX,
        tableStartY + (rowIndex + 1) * tableRowHeight
      );
      doc.text(
        infraction.user,
        startX + 60,
        tableStartY + (rowIndex + 1) * tableRowHeight
      );
      doc.text(
        infraction.date,
        startX + 120,
        tableStartY + (rowIndex + 1) * tableRowHeight
      );
    });

    // Guardar el PDF
    doc.save('infracciones.pdf');
  }

  getPaginatedFines(
    page: number,
    limit: number,
    searchParams: any = {}
  ): Observable<{ items: Fine[]; total: number }> {
    this._loading$.next(true);
    let params = new HttpParams()
      .set('page', (page - 1).toString())
      .set('size', limit.toString());

    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key]) {
        if (Array.isArray(searchParams[key])) {
          searchParams[key].forEach((value) => {
            params = params.append(key, value.toString());
          });
        } else {
          params = params.set(key, searchParams[key].toString());
        }
      }
    });

    return this.http.get<any>(`${this.apiUrl}/fine/pageable`, { params }).pipe(
      map((data) => {
        const items = data.content || [];
        const total = data.totalElements || 0;
        return { items, total };
      }),
      finalize(() => this._loading$.next(false))
    );
  }

  getMostFinedPlots(searchParams: any = {}): Observable<any[]> {
    let params = new HttpParams();

    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key]) {
        params = params.set(key, searchParams[key]);
      }
    });

    return this.http.get<any[]>(`${this.apiUrl}/fine/plots/most-fined`, {
      params,
    });
  }
}
