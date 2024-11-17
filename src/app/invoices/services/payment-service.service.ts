import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PaymentDto } from '../models/PaymentDto';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class PaymentServiceService {
  // Base URL para el servicio de tickets
  private readonly baseUrl = environment.apis.payments;
  // private readonly baseUrl = 'http://localhost:8090/payments';//DEV
  userId : Number;
  constructor(private http: HttpClient) {
    this.userId = sessionStorage.getItem('userId') ? Number(sessionStorage.getItem('userId')) : 1;
  }

  getPaymentByTicketId(ticketId: Number) {
    const headers = {
      'x-user-id': this.userId.toString(),
    };
    // const url = `${this.baseUrl}/ticket/${ticketId}`;
    const url = `${this.baseUrl}ticket/${ticketId}`; //prod
    return this.http.get<PaymentDto>(url, {
      headers: headers,
    });
  }
}
