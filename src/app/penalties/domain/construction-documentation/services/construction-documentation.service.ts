import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  throwError,
} from 'rxjs';

import { ConstructionDocumentationTypeResponseDTO } from '../models/construction-documentation.model';
import {
  ConstructionDocResponseDto,
  ConstructionDocUpdateStatusRequestDto,
} from '../models/construction-doc.model';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../users/models/user';
import { SessionService } from '../../../../users/services/session.service';

@Injectable({
  providedIn: 'root',
})
export class ConstructionDocumentationService {
  private apiUrl = environment.apis.constructions.slice(0, -1);

  private documentationTypesSubject = new BehaviorSubject<
    ConstructionDocumentationTypeResponseDTO[]
  >([]);
  documentationTypes$ = this.documentationTypesSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private readonly http = inject(HttpClient);

  private itemsSubject = new BehaviorSubject<ConstructionDocResponseDto[]>([]);
  items$ = this.itemsSubject.asObservable();

  private readonly sessionService = inject(SessionService);

  getHeaders(): HttpHeaders {
    const user: User = this.sessionService.getItem('user');
    const userId = user?.id || 1;

    return new HttpHeaders().set('x-user-id', userId.toString());
  }

  updateConstructionDocStatus(
    updateStatusRequestDto: ConstructionDocUpdateStatusRequestDto
  ): Observable<ConstructionDocResponseDto> {
    return this.http.put<ConstructionDocResponseDto>(
      `${this.apiUrl}/constructions/documentation/status`,
      updateStatusRequestDto,
      { headers: this.getHeaders() }
    );
  }

  deleteConstructionDoc(
    constructionDocId: number
  ): Observable<ConstructionDocResponseDto> {
    return this.http.delete<ConstructionDocResponseDto>(
      `${this.apiUrl}/constructions/documentation/${constructionDocId}`
    );
  }

  getAllDocumentationTypes(): Observable<
    ConstructionDocumentationTypeResponseDTO[]
  > {
    this.isLoadingSubject.next(true); // Iniciar loading

    return this.http
      .get<ConstructionDocumentationTypeResponseDTO[]>(
        `${this.apiUrl}/documentation-types`
      )
      .pipe(
        map((data) => {
          this.documentationTypesSubject.next(data);
          return data;
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  uploadDocumentation(formData: any, userId: number): Observable<any> {
    const form = new FormData();
    form.append('documentation_type_id', formData.documentation_type_id);
    form.append('construction_id', formData.construction_id);
    form.append('created_by', formData.created_by);
    form.append('file', formData.file);
    const headers= new HttpHeaders().set('x-user-id', userId.toString());


    return this.http
      .post<any>(`${this.apiUrl}/constructions/documentation`, form, {headers})
      .pipe(
        map(
          (newDocumentation) => {
            return newDocumentation;
          },
          catchError((error) => {
            return throwError(
              () => new Error('Error en alta de documentacion')
            );
          })
        )
      );
  }

  downloadDocumentation(documentationId: number): void {
    const url = `${this.apiUrl}/constructions/documentation/${documentationId}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (response: Blob) => {
        this.downloadFile(response, `document_${documentationId}.pdf`);
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
}
