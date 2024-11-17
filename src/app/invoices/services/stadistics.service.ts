import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OtherReport, TicketFilter, TicketInfo, Top5, TopPayments } from '../models/stadistics';
import { PaymentReportDto } from '../models/payments.report.model';
import { TicketReportDto } from '../models/ticket.report.model';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class StadisticsService {

  private readonly baseUrl = environment.apis.tickets + 'report';
  private readonly baseUrlTicket = environment.apis.tickets + 'tickets';
  private readonly baseUrlpayments = environment.apis.payments + 'topPayments';
  private readonly baseUrlpaymentsReport = environment.apis.payments + 'report';

  // private readonly baseUrl = 'http://localhost:8087/report'; // DEV
  // private readonly baseUrlTicket = 'http://localhost:8087/tickets';
  // private readonly baseUrlpayments = 'http://localhost:8092/report/topPayments';
  // private readonly baseUrlpaymentsReport = 'http://localhost:8092/report';

  // Endpoints específicos
  private readonly apiUrl = this.baseUrl;
  userId : Number;
  constructor(private http: HttpClient) {
    this.userId = sessionStorage.getItem('userId') ? Number(sessionStorage.getItem('userId')) : 1;
  }

  getBaseReport(fechas: TicketFilter): Observable<Top5> {
    const header = {
      'x-user-id': this.userId.toString(),
    };
    return this.http.post<Top5>(this.apiUrl + '/top5', fechas, {
      headers: header
    });
  }

  getOtherReport(fechas: TicketFilter): Observable<OtherReport> {
    const header = {
      'x-user-id': this.userId.toString(),
    };
    return this.http.post<OtherReport>(this.apiUrl + '/otherReports', fechas, {
      headers: header
    });
  }

  getAmountByDate(fechas: TicketFilter): Observable<TicketInfo[]> {
    const header = {
      'x-user-id': this.userId.toString(),
    };
    return this.http.post<TicketInfo[]>(this.apiUrl + '/totalPayments', fechas, {
      headers: header
    });
  }

  getPreferredApproved(fechas: TicketFilter): Observable<TopPayments> {
    console.log(fechas);
    const header = {
      'x-user-id': this.userId.toString(),
    };
    return this.http.post<TopPayments>(this.baseUrlpaymentsReport + '/topPaymentsApproved', fechas, {
      headers: header
    });
  }

  getPreferredRejected(fechas: TicketFilter): Observable<TopPayments> {
    const header = {
      'x-user-id': this.userId.toString(),
    };
    return this.http.post<TopPayments>(this.baseUrlpaymentsReport + '/topPaymentsRejected', fechas, {
      headers: header
    });
  }

  getDinamycFilters(filters: any) {
    let httpParams = new HttpParams()
    const header = {
      'x-user-id': this.userId.toString(),
    };
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== undefined && filters[key] !== '') {
        httpParams = httpParams.set(key, filters[key].toString());
      }
    }

    return this.http.get<PaymentReportDto[]>(this.baseUrlpaymentsReport + '/filters', {params: httpParams, headers : header});
  }

  getDinamycFilterTickets(filters: any) : Observable<TicketReportDto[]> {

    // ESTO CAUSA EL CICLO WHILE ???
    // if (filters.startExpirationDate != null && filters.endExpirationDate != null) {
    //   filters.startExpirationDate = filters.startExpirationDate + '-01';
    //   filters.endExpirationDate = filters.endExpirationDate + '-01';
    // }
    const header = {
      'x-user-id': this.userId.toString(),
    };
    let params = new HttpParams()
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    }

    return this.http.get<TicketReportDto[]>(this.baseUrlTicket + '/filters', {params, headers: header});
  }
}
