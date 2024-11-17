import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { TicketDto } from '../models/TicketDto';
import { tick } from '@angular/core/testing';
import { PaginatedResponse } from '../models/api-response';
import { TransformTicketPipe } from '../pipes/ticket-mapper.pipe';
import { RequestTicket, RequestTicketOwner } from '../models/RequestTicket';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
    // Base URL para el servicio de tickets
  private readonly baseUrl = environment.apis.tickets;
  // private readonly baseUrl = 'https://lbsm4xgt-8080.brs.devtunnels.ms/tickets/tickets';//DEV

  // Endpoints específicos prod
  private readonly apiUrl = this.baseUrl;
  private readonly apiUrlPdf = this.baseUrl + 'generateTicket/';
  private readonly apiGetAllByOwner = this.baseUrl + 'getAllTicketsByOwner';
  private readonly apiGetAll = this.baseUrl + 'getAll';
  // // Endpoints específicos
  // private readonly apiUrl = this.baseUrl;
  // private readonly apiUrlPdf = this.baseUrl + '/generateTicket/';
  // private readonly apiGetAllByOwner = this.baseUrl + '/getAllTicketsByOwner';
  // private readonly apiGetAll = this.baseUrl + '/getAll';
    
  userId : Number;
    constructor(private http: HttpClient) { 
      this.userId = sessionStorage.getItem('userId') ? Number(sessionStorage.getItem('userId')) : 1;
      console.log(this.userId);
    }

    filtrarfechas(dtobusqueda: any): Observable<any> {
      const header = {
        'x-user-id': this.userId.toString(),
      };
      return this.http.post<any>(this.apiUrl + '/search', dtobusqueda, {
        headers: header
      });
    }



    getAllTicketsContent(): Observable<TicketDto[]> {
      const header = {
        'x-user-id': this.userId.toString(),
      };
      return this.http.get<{ content: TicketDto[] }>( this.baseUrl + '/tickets/getAll', {
        headers: header
      }).pipe(
        map(response => response.content) // Extrae solo content del objeto de respuesta
      );
    }
    
    getAll(requestTicket: RequestTicket, page : number, size : number): Observable<PaginatedResponse<TicketDto>> {
      let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      const header = {
        'x-user-id': this.userId.toString(),
      };
      return this.http.post<PaginatedResponse<TicketDto>>(this.apiGetAll, requestTicket, { params, headers: header }).pipe(
        map((response: PaginatedResponse<any>) => {
          const transformPipe = new TransformTicketPipe();
          const transformedPlots = response.content.map((plot: any) => transformPipe.transform(plot));
          return {
            ...response,
            content: transformedPlots 
          };
        })
      );
    }
  
    // getAll(page : number, size : number): Observable<PaginatedResponse<TicketDto>> {
    //   let params = new HttpParams()
    //   .set('page', page.toString())
    //   .set('size', size.toString());
        
    //   return this.http.get<PaginatedResponse<TicketDto>>(this.apiGetAll, { params }).pipe(
    //     map((response: PaginatedResponse<any>) => {
    //       const transformPipe = new TransformTicketPipe();
    //       const transformedPlots = response.content.map((plot: any) => transformPipe.transform(plot));
    //       return {
    //         ...response,
    //         content: transformedPlots 
    //       };
    //     })
    //   );
    // }

    // filterTicketByStatus(page : number, size : number, plotType : string) {
    //   let params = new HttpParams()
    //   .set('ownerId', 1)
    //   .set('status', 'PAID')
    //   .set('page', page.toString())
    //   .set('size', size.toString());
    
    //   return this.http.get<PaginatedResponse<TicketDto>>(this.apiGetAllByOwner, { params }).pipe(
    //     map((response: PaginatedResponse<any>) => {
    //       const transformPipe = new TransformTicketPipe();
    //       const transformedPlots = response.content.map((plot: any) => transformPipe.transform(plot));
    //       return {
    //         ...response,
    //         content: transformedPlots 
    //       };
    //     })
    //   );
    // }

    // getAllForPDFUser()

    getAllByOwner(requestTicket: RequestTicketOwner, page : number, size : number): Observable<PaginatedResponse<TicketDto>> {
      requestTicket.ownerId = 1;
      let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      const header = {
        'x-user-id': this.userId.toString(),
      };
        
      return this.http.post<PaginatedResponse<TicketDto>>(this.apiGetAllByOwner, requestTicket, { params, headers: header }).pipe(
        map((response: PaginatedResponse<any>) => {
          const transformPipe = new TransformTicketPipe();
          const transformedPlots = response.content.map((plot: any) => transformPipe.transform(plot));
          return {
            ...response,
            content: transformedPlots 
          };
        })
      );
    }

    getAllByOwnerWithFilters(page : number, size : number, status?:string): Observable<PaginatedResponse<TicketDto>> {
      let params = new HttpParams().set('ownerId', 1);
      // .set('owner;
      // .set('page', page.toString())
      // .set('size', size.toString());
      const header = {
        'x-user-id': this.userId.toString(),
      };

      if (status) {
        params = params.set('status', status);
      }
      return this.http.get<PaginatedResponse<TicketDto>>(this.apiGetAllByOwner, { params, headers: header }).pipe(
        map((response: PaginatedResponse<any>) => {
          const transformPipe = new TransformTicketPipe();
          const transformedPlots = response.content.map((plot: any) => transformPipe.transform(plot));
          return {
            ...response,
            content: transformedPlots 
          };
        })
      );
    }

    getAllTicketsPageForExports(page : number, size : number): Observable<PaginatedResponse<TicketDto>> {
      const ownerId = 1;
      let params = new HttpParams()
      .set('ownerId', ownerId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
      const header = {
        'x-user-id': this.userId.toString(),
      };
      return this.http.get<PaginatedResponse<TicketDto>>(this.apiGetAll, { params, headers: header }).pipe(
        map((response: PaginatedResponse<any>) => {
          const transformPipe = new TransformTicketPipe();
          const transformedPlots = response.content.map((plot: any) => transformPipe.transform(plot));
          return {
            ...response,
            content: transformedPlots   
          };
        })
      );
    }

    downloadPdf(ticketId: Number): Observable<Blob> {
      return this.http.get(this.apiUrlPdf + ticketId, {
        responseType: 'blob' // Necesario para manejar archivos
      });
    }

  getAllWithFilters(page: number, size: number, status?: string, lotId?:string, firstPeriod?: string, lastPeriod?: string, ownerId?: number): Observable<PaginatedResponse<TicketDto>> {
    let params = new HttpParams();
      params.set('page', page.toString())
      .set('size', size.toString());
    console.log(params);
      
    const header = {
      'x-user-id': this.userId.toString(),
    };
      const request = this.buildRequestTicket(status, firstPeriod, lastPeriod);      
    

    return this.http.post<PaginatedResponse<TicketDto>>(this.apiGetAll, request ,{ params: params, headers:header }).pipe(
      map((response: PaginatedResponse<any>) => {
        const transformPipe = new TransformTicketPipe();
        const transformedPlots = response.content.map((plot: any) => transformPipe.transform(plot));
        return {
          ...response,
          content: transformedPlots 
        };
      })
    );
  }


  buildRequestTicket(status?: string, firstPeriod?: string, lastPeriod?: string): RequestTicket { 
    return { 
      status: status ?? null, 
      firstPeriod: firstPeriod ?? null, 
      lastPeriod: lastPeriod ?? null 
    };
  }

  buildRequestTicketOwner(ownerId: number, status?: string, firstPeriod?: string, lastPeriod?: string): RequestTicketOwner { 
    return { 
      ownerId, 
      status: status ?? null, 
      firstPeriod: firstPeriod ?? null, 
      lastPeriod: lastPeriod ?? null 
    };
  }

  updateTicketStatus(id: number, status: string): Observable<TicketDto> {
    const url = `${this.baseUrl}/updateTicketStatus/${id}`;
    const params = new HttpParams().set('status', status);
    return this.http.put<TicketDto>(url, null, { params });
  }



  
  cutYearFilter(year : string) {
    if(year == null) {
      return '';
    }
    const yearStr = year.toString();
    // if(yearStr != '' && yearStr.startsWith('20')) {
    //   return yearStr.slice(2);
    // }
    if(yearStr != '' && Number(yearStr) < 2000){
      alert('El año ingresado no es valido');
    }
    return year;
  }

  isValidYearFilter(year: string): boolean {
    if((Number(year) < 1900) && year != "") {
      alert('El año ingresado no es valido');
      return false;
    }

    return true;

  }

  isValidateFullDate(year: string, month:string){
    if (year == null) {
      return true;
    }
    if(year != '' && month == ''){
      alert('Completar correctamente los periodos.');
      return false;
    }
    if(year == '' && month != ''){
      alert('Completar correctamente los periodos.');
      return false;
    }

    return true;
  }

  isValidPeriod(year: string, month: string): boolean {
    if (!year || !month) {
      return false;
    }
    const numberMonth = Number(month);
    const numberYear = Number(year);
    if (isNaN(numberMonth) || numberMonth < 1 || numberMonth > 12 || isNaN(numberYear)) {
      return false;
    }
  
    const date = new Date(Date.UTC(numberYear, numberMonth - 1, 1));
    const validYear = date.getUTCFullYear();
    const validMonth = date.getUTCMonth() + 1;
  
    return validYear === numberYear && validMonth === numberMonth;
  }
  
  convertToPeriod(year: string, month: string): string {
    if (this.isValidPeriod(year, month)) {
      return `${month.padStart(2, '0')}/${year.slice(-2)}`;
    }
    return '';
  }

}
