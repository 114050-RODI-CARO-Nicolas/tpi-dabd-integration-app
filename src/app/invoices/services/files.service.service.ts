import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketDto } from '../models/TicketDto';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class FilesServiceService {
  private baseUrl = environment.apis.tickets + 'files';
  private baseUrl2 = environment.apis.tickets + 'files';
  // private baseUrl = 'http://localhost:8087/files'; //DEV USSAGE
  // private baseUrl2 = 'http://localhost:8090/files';

  userId : Number;

  constructor(private http: HttpClient) {
    this.userId = sessionStorage.getItem('userId') ? Number(sessionStorage.getItem('userId')) : 1;
  }

  downloadFile(fileUrl: string): Observable<Blob> {
    const headers = new HttpHeaders({
      'x-user-id': this.userId.toString(),
    });
    return this.http.get(`${this.baseUrl}/download?fileUrl=${fileUrl}`, {
      responseType: 'blob',
    });
  }

  downloadFilePayment(fileUrl: string): Observable<Blob> {
    const headers = new HttpHeaders({
      'x-user-id': this.userId.toString(),
    });
    return this.http.get(`${this.baseUrl2}/download?fileUrl=${fileUrl}`, {
      responseType: 'blob',
      headers: headers,
    });
  }

  uploadFiles(
    ownerId: number,
    fileType: string,
    files: File[]
  ): Observable<TicketDto[]> {
    const headers = new HttpHeaders({
      'x-user-id': this.userId.toString(),
      enctype: 'multipart/form-data',
    });
    const formData: FormData = new FormData();
    formData.append('type', JSON.stringify({ type: fileType }));

    for (const file of files) {
      formData.append('files', file, file.name);
    }

    return this.http.post<TicketDto[]>(
      `${this.baseUrl}/${ownerId}/files`,
      formData,
      {
        headers: headers,
      }
    );
  }
}
