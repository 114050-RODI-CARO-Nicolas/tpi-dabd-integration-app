import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { InfractionDto } from '../../infraction/models/infraction.model';
import {
  BehaviorSubject,
  catchError,
  finalize,
  map,
  Observable,
  throwError,
} from 'rxjs';
import { ClaimDTO, ClaimNew, UpdateClaimDTO } from '../models/claim.model';
import { environment } from '../../../../../../environments/environment';
import { SessionService } from '../../../../../users/services/session.service';
import { User } from '../../../../../users/models/user';
import { UserDataService } from '../../../../shared/services/user-data.service';

@Injectable({
  providedIn: 'root',
})
export class ClaimService {
  private http = inject(HttpClient);
  private userDataService = inject(UserDataService);

  private apiUrl = environment.apis.moderations.slice(0, -1); // URL de la API

  // private oneClaim = new BehaviorSubject<OneConstruction>(undefined);
  // oneClaim$ = this.oneClaim.asObservable();

  private itemsSubject = new BehaviorSubject<ClaimDTO[]>([]);
  items$ = this.itemsSubject.asObservable();

  private totalItemsSubject = new BehaviorSubject<number>(0);
  totalItems$ = this.totalItemsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private oneClaim = new BehaviorSubject<ClaimDTO | undefined>(undefined);
  oneClaim$ = this.oneClaim.asObservable();

  setItems(items: ClaimDTO[]): void {
    this.itemsSubject.next(items);
  }

  setTotalItems(total: number): void {
    this.totalItemsSubject.next(total);
  }

  
  private readonly sessionService = inject(SessionService);


  createClaim(claimData: FormData): Observable<any> {

    return this.http.post(`${this.apiUrl}/claims`, claimData,{
      headers: this.userDataService.getHeaders(),
    });
  }

  updateClaim(claimDTO: ClaimDTO): Observable<ClaimDTO> {

    return this.http
      .put<ClaimDTO>(
        `${this.apiUrl}/claims/${claimDTO.id}`,
        {
          description: claimDTO.description,
          plot_id: claimDTO.plot_id,
          sanction_type_entity_id: claimDTO.sanction_type.id,
        },
        {
          headers: this.userDataService.getHeaders(),
        }
      )
      .pipe(
        map((newItem) => {
          return newItem;
        }),
        catchError((error) => {
          return throwError(() => new Error('Error en actualización de multa'));
        })
      );
  }

  disapproveClaim(claimId: number, userId: number): Observable<ClaimDTO> {
    const headers = new HttpHeaders({
      'x-user-id': userId.toString(),
    });

    return this.http
      .put<ClaimDTO>(
        `${this.apiUrl}/claims/${claimId}/disapprove`,
        {},
        { headers }
      )
      .pipe(
        map((newItem) => {
          return newItem;
        }),
        catchError((error) => {
          return throwError(() => new Error('Error en actualización de multa'));
        })
      );
  }

  getAllItems(page: number, limit: number) {
    let params = new HttpParams()
      .set('page', (page - 1).toString())
      .set('size', limit.toString());

    return this.http
      .get<any>(`${this.apiUrl}/claims/pageable`, { params })
      .pipe(
        map((data) => {
          return data.content;
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPaginatedClaims(
    page: number,
    limit: number,
    searchParams: any = {}
  ): Observable<{ items: ClaimDTO[]; total: number }> {
    this.isLoadingSubject.next(true);
    let params = new HttpParams()
      .set('page', (page - 1).toString())
      .set('size', limit.toString());

    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key]) {
        if (Array.isArray(searchParams[key])) {
          // Si es un array, usar append para cada valor
          searchParams[key].forEach((value) => {
            params = params.append(key, value.toString());
          });
        } else {
          // Si no es un array, usar set
          params = params.set(key, searchParams[key].toString());
        }
      }
    });

    return this.http
      .get<any>(`${this.apiUrl}/claims/pageable`, { params })
      .pipe(
        map((data) => {
          const items = data.content || [];
          const total = data.totalElements || 0;
          return { items, total };
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getClaimById(id: number): Observable<ClaimDTO | undefined> {
    return this.http.get<ClaimDTO>(`${this.apiUrl}/claims/${id}`).pipe(
      map((oneClaim) => {
        this.oneClaim.next(oneClaim);
        return oneClaim;
      })
    );
  }

  downloadDocumentation(documentationId: number, filename: string): void {
    const url = `${this.apiUrl}/proof/documentation/${documentationId}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (response: Blob) => {
        this.downloadFile(response, filename);
      },
      error: (error) => {
        console.error('Download failed', error);
      },
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getClaimByInfractionId(id: number): Observable<ClaimDTO[]> {
    return this.http.get<ClaimDTO[]>(`${this.apiUrl}/claims/infraction/${id}`);
  }
}
