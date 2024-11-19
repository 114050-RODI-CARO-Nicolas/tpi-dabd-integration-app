import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company, CompanyRequest } from '../../models/suppliers/company.model';
import { PORTSuppliers } from '../../utils/const';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  //private apiCompanyUrl = 'http://localhost:8013/suppliers/companies';
  private apiCompanyUrl = PORTSuppliers + 'suppliers/companies';
  

  constructor(private http: HttpClient) { }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiCompanyUrl);
  }

  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiCompanyUrl}/${id}`);
  }

  createCompany(company: Company): Observable<Company> {
    const request: CompanyRequest = { name: company.name }
    return this.http.post<Company>(this.apiCompanyUrl, request);
  }

  updateCompany(updatedCompany: Company): Observable<Company> {
    return this.http.put<Company>(this.apiCompanyUrl, updatedCompany);
  }

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiCompanyUrl}/${id}`);
  }
}