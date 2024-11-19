import { CategoryCharge, Charge, ChargeType, ReportCharge } from './../models/charge';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PORT } from '../const';
import Category from '../models/category';

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChargeService {
  private http = inject(HttpClient);
  private categoryChargeUrl = `${PORT}category-charges`;
  private apiUrl = `${PORT}charges`
  private urlReport = `${PORT}report/charge`;
  constructor() {}

  addCharge(charge: Charge, userId: number): Observable<Charge> {
    const headers = new HttpHeaders({
      'x-user-id': userId
    });
    return this.http.post<Charge>(this.apiUrl, charge, { headers });
  }

  getChargesAll(): Observable<Charge[]> {
    return this.http.get<Charge[]>(this.apiUrl);
  }
  
  getCharges(page: number, size: number, periodId?: number, plotId?: number, categoryId?: number,type?: ChargeType): Observable<Page<Charge>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (periodId != undefined || periodId != null ) {
      if(periodId != 0){
        params = params.set('period', periodId.toString());
      }      
    }
    if(plotId != undefined || plotId != null ){
      if (plotId) {
        params = params.set('lot', plotId);
      }
    }
    
    if (categoryId != undefined || categoryId != null) {
      if(categoryId != 0){
        params = params.set('category', categoryId.toString());
      }
    }
    
    if (type != undefined || type != null) {     
      let tipo = '';
      switch(type){
        case 'Positivo': tipo = 'ABSOLUTE'; break;
        case 'Porcentaje': tipo ='PERCENTAGE'; break;
        case 'Negativo': tipo = 'NEGATIVE'; break;
        default : tipo = 'ABSOLUTE'; break;

      } 
      params = params.set('type', tipo);
      
    }
    return this.http.get<Page<Charge>>(this.apiUrl, { params });
    /*
    .pipe(
      map(page => {
        // Accede a `content` y asigna valores predeterminados si es necesario
        page.content = page.content.map(charge => ({
          ...charge,
          period: charge.period || { month: 0, year: 0, state: 'UNKNOWN', id: 0 }
        }));
        return page;
      })
    )
    */
  }

  updateCharge(charge: Charge, userId: number): Observable<Charge> {
    const headers = new HttpHeaders({
      'x-user-id': userId
    });
    return this.http.put<Charge>(`${this.apiUrl}/${charge.chargeId}`, charge, {headers});
  }  

  deleteCharge(charge: number): Observable<Boolean> {
    return this.http.delete<Boolean>(this.apiUrl + '/' + charge);
    //return this.http.put<Charge>(`${this.apiUrl}/${charge.charge_id}`, charge);
  }

  deleteCharge2(charge: number): Observable<Charge> {
    return this.http.delete<Charge>(this.apiUrl + '/' + charge);
  }




  createCharge(charge: Charge): Observable<Charge> {
    return this.http.post<Charge>(this.apiUrl, charge);
  }

  getCategoryCharges(excluingFines : boolean |true): Observable<CategoryCharge[]> {
    let params = new HttpParams;
    params = params.set('status', true);
    params = params.set('excluingFines', excluingFines);
    return this.http.get<CategoryCharge[]>(`${this.categoryChargeUrl}/all`, { params });
    //return this.http.get<CategoryCharge[]>(`${this.categoryChargeUrl}`);

  }

  getCategoriesExcFines() : Observable<CategoryCharge[]> {
    return this.getCategoryCharges(true);
  }

  addCategory(categoryCharge : CategoryCharge, userId: number) : Observable<CategoryCharge> {
    const headers = new HttpHeaders({
      'x-user-id': userId
    });

    //categoryCharge.amountSing = ChargeType.ABSOLUTE;
    return this.http.post<CategoryCharge>(this.categoryChargeUrl, categoryCharge, { headers });
  }

  updateCategory(categoryCharge : CategoryCharge, userId: number) : Observable<CategoryCharge> {
    const headers = new HttpHeaders({
      'x-user-id': userId
    });
    return this.http.put<CategoryCharge>(`${this.categoryChargeUrl}/${categoryCharge.categoryChargeId}`, categoryCharge, { headers });
  }

  deleteCategoryCharge(category: number): Observable<Boolean> {
    return this.http.delete<Boolean>(`${this.categoryChargeUrl}/${category}`);
  }

  validateCategoryName(name: string): Observable<boolean> {
    return this.getCategoryCharges(false).pipe(
      map(categories => categories.some(category => category.name.toLowerCase() === name.toLowerCase() ))
    );
  }

  getCategoryChargesPagination(page: number, size: number, type?: ChargeType, status? : boolean, excluingFines? : boolean): Observable<Page<CategoryCharge>> {
    debugger
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);    

    if(excluingFines != undefined && excluingFines != null) {   
         
      params = params.set('excluingFines', excluingFines!);
    } 
    if(status != undefined && status != null) {    
      debugger  
      params = params.set('status', status!);
    }
    if (type != undefined && type != null) {    
      debugger 
      let tipo = '';
      switch(type){
        case 'Positivo': tipo = 'ABSOLUTE'; break;
        case 'Porcentaje': tipo ='PERCENTAGE'; break;
        case 'Negativo': tipo = 'NEGATIVE'; break;
        default : tipo = 'ABSOLUTE'; break;

      }
      params = params.set('type', tipo);
    }
    
       
    return this.http.get<Page<CategoryCharge>>(this.categoryChargeUrl, { params });
  }

  /****ACA VIENE LO DE  REPORTE */
  getReport(periodId : number) : Observable<ReportCharge> {
    return this.http.get<ReportCharge>(`${this.urlReport}?periodId=${periodId}`);
  }
}
