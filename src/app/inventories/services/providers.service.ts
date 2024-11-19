import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../models/suppliers/supplier.model';
import { PaginatedResponse } from '../models/api-response';
import { Company } from '../models/suppliers/company.model';
import { Service } from '../models/suppliers/service.model';
import { PORTSuppliers } from '../utils/const';

@Injectable({
  providedIn: 'root',
})
 export class ProvidersService {
//   private apiUrl = 'http://localhost:8013/suppliers';
//   private apiurlService = 'http://localhost:8013/service';

  private apiUrl = PORTSuppliers + 'suppliers';
  private apiurlService = PORTSuppliers + 'service';

  constructor(private http: HttpClient) {}

  getProviders(filters?: {
    page?: number,
    size?: number
    name?: string,
    cuil?: string,
    contact?: string,
    address?: string,
    enabled?: boolean,
    'company.name'?: string,
    'service.name'?: string,
    start?: string,
    end?: string
  }): Observable<PaginatedResponse<Supplier>> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== '' && value !== null) {
          params = params.append(key, value.toString());
        }
      });
    }

    console.log('Parámetros finales enviados al backend:', params.toString()); // Depuración
    return this.http.get<PaginatedResponse<Supplier>>(`${this.apiUrl}/pageable`, { params });
  }
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getProviderDashboard(dateFilter?: { start?: string; end?: string; state?: string }): Observable<PaginatedResponse<Supplier>> {
    let params = new HttpParams().set('page', '0').set('size', '9999999');
  
    if (dateFilter?.start) {
      params = params.set('start', dateFilter.start);
    }
    if (dateFilter?.end) {
      params = params.set('end', dateFilter.end);
    }
    if (dateFilter?.state) {
      params = params.set('state', dateFilter.state);
    }
  
    console.log('Parámetros enviados al backend:', params.toString());
  
    return this.http.get<PaginatedResponse<Supplier>>(`${this.apiUrl}/pageable`, { params });
  }
  
  
  getCompany(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}/companies`);
  }

  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiurlService);
  }

  // Método auxiliar para validar fechas
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  getProviderById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  addProvider(provider: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, provider);
  }

  updateProvider(provider: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(this.apiUrl, provider);
  }

  deleteProvider(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
