import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, finalize, map } from 'rxjs';
import {
  ConstructionRequestDto,
  ConstructionResponseDto,
  ConstructionUpdateRequestDto,
  ConstructionUpdateStatusRequestDto,
} from '../models/construction.model';
import { environment } from '../../../../../environments/environment';
import { SessionService } from '../../../../users/services/session.service';
import { User } from '../../../../users/models/user';
import { UserDataService } from '../../../shared/services/user-data.service';

type OneConstruction = ConstructionResponseDto | undefined;

@Injectable({
  providedIn: 'root',
})
export class ConstructionService {
  private apiUrl =
    environment.apis.constructions.slice(0, -1) + '/constructions';

  private oneConstruction = new BehaviorSubject<OneConstruction>(undefined);
  oneConstruction$ = this.oneConstruction.asObservable();

  private itemsSubject = new BehaviorSubject<ConstructionResponseDto[]>([]);
  items$ = this.itemsSubject.asObservable();

  private totalItemsSubject = new BehaviorSubject<number>(0);
  totalItems$ = this.totalItemsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private readonly http = inject(HttpClient);

  private userDataService = inject(UserDataService);



  getAllItems(): Observable<ConstructionResponseDto[]> {
    return this.http.get<ConstructionResponseDto[]>(this.apiUrl);
  }

  getAllConstructions(
    page: number,
    limit: number,
    searchParams: any = {}
  ): Observable<{ items: ConstructionResponseDto[]; total: number }> {
    this.isLoadingSubject.next(true); // Iniciar loading
    let params = new HttpParams()
      .set('page', (page - 1).toString())
      .set('size', limit.toString());

    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key]) {
        params = params.set(key, searchParams[key]);
      }
    });

    return this.http.get<any>(`${this.apiUrl}/pageable`, { params }).pipe(
      map((data) => {
        const items = data.content || [];
        const total = data.totalElements || 0;
        return { items, total };
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getConstructionById(
    id: number
  ): Observable<ConstructionResponseDto | undefined> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((oneConstruction) => {
        this.oneConstruction.next(oneConstruction);
        return oneConstruction;
      })
    );
  }

  registerConstruction(
    construction: ConstructionRequestDto
  ): Observable<ConstructionResponseDto> {
    return this.http
      .post<ConstructionResponseDto>(this.apiUrl, construction, {
        headers: this.userDataService.getHeaders(),
      })
      .pipe(
        map((newItem) => {
          const updatedItems = [...this.itemsSubject.value, newItem];
          this.itemsSubject.next(updatedItems);
          return newItem;
        })
      );
  }

  updateConstructionStatus(
    updateStatusRequestDto: ConstructionUpdateStatusRequestDto
  ): Observable<ConstructionResponseDto> {
    return this.http.put<ConstructionResponseDto>(
      `${this.apiUrl}/status`,
      updateStatusRequestDto,
      { headers: this.userDataService.getHeaders() }
    );
  }

  setItems(items: ConstructionResponseDto[]): void {
    this.itemsSubject.next(items);
  }

  setTotalItems(total: number): void {
    this.totalItemsSubject.next(total);
  }

  updateConstruction(
    id: number,
    updateStatusRequestDto: ConstructionUpdateRequestDto
  ): Observable<ConstructionResponseDto> {
    return this.http.put<ConstructionResponseDto>(
      `${this.apiUrl}/${id}`,
      updateStatusRequestDto,
      { headers: this.userDataService.getHeaders() }
    );
  }

  approveConstruction(id: number): Observable<ConstructionResponseDto> {
    return this.http.put<ConstructionResponseDto>(
      `${this.apiUrl}/approve/${id}`,
      {},
      { headers: this.userDataService.getHeaders() }
    );
  }

  startConstruction(id: number): Observable<ConstructionResponseDto> {
    return this.http.put<ConstructionResponseDto>(
      `${this.apiUrl}/start/${id}`,
      {},
      { headers: this.userDataService.getHeaders() }
    );
  }

  finishConstruction(
    id: number,
    userId: number
  ): Observable<ConstructionResponseDto> {
    return this.http.put<ConstructionResponseDto>(
      `${this.apiUrl}/complete/${id}`,
      {},
      { headers: this.userDataService.getHeaders() }
    );
  }

  onReviewConstruction(id: number): Observable<ConstructionResponseDto> {
    return this.http.put<ConstructionResponseDto>(
      `${this.apiUrl}/review/${id}`,
      {},
      { headers: this.userDataService.getHeaders() }
    );
  }

  rejectConstruction(
    id: number,
    reason: string
  ): Observable<ConstructionResponseDto> {
    return this.http.put<ConstructionResponseDto>(
      `${this.apiUrl}/reject/${id}`,
      { rejectionReason: reason },
      { headers: this.userDataService.getHeaders() }
    );
  }

  getMonthlyConstructionStats(searchParams: any = {}): Observable<any[]> {
    let params = new HttpParams();

    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key]) {
        params = params.set(key, searchParams[key]);
      }
    });

    return this.http.get<any[]>(`${this.apiUrl}/stats/monthly`, { params });
  }
}
