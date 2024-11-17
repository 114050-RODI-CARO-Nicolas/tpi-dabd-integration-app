import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketDto } from '../models/TicketDto';

@Injectable({
  providedIn: 'root',
})
export class FilesServiceService {
  private baseUrl = 'http://localhost:8087/files';
  private baseUrl2 = 'http://localhost:8090/files';


  constructor(private http: HttpClient) {}

  downloadFile(fileUrl: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download?fileUrl=${fileUrl}`, {
      responseType: 'blob',
    });
  }

  downloadFilePayment(fileUrl: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl2}/download?fileUrl=${fileUrl}`, {
      responseType: 'blob',
    });
  }

  uploadFiles(
    ownerId: number,
    fileType: string,
    files: File[]
  ): Observable<TicketDto[]> {
    const formData: FormData = new FormData();
    formData.append('type', JSON.stringify({ type: fileType }));

    for (const file of files) {
      formData.append('files', file, file.name);
    }

    return this.http.post<TicketDto[]>(
      `${this.baseUrl}/${ownerId}/files`,
      formData,
      {
        headers: {
          enctype: 'multipart/form-data',
        },
      }
    );
  }
}
