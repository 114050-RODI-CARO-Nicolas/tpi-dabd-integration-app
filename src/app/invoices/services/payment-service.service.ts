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
  // private readonly baseUrl = 'https://lbsm4xgt-8080.brs.devtunnels.ms/payments';//DEV
  userId : Number;
  constructor(private http: HttpClient) {
    let session = JSON.parse(sessionStorage.getItem('user')!)
    this.userId = session.value.id;
    console.log(this.userId);
  }

  getPaymentByTicketId(ticketId: Number) {
    const headers = {
      'x-user-id': this.userId.toString(),
    };
    // const url = `${this.baseUrl}/ticket/${ticketId}`;
    const url = `${this.baseUrl}payments/ticket/${ticketId}`; //prod
    return this.http.get<PaymentDto>(url, {
      headers: headers,
    });
  }


  saveReceipt(formData : FormData) {
    const headers = {
      'x-user-id': this.userId.toString(),
    };
    this.http
      .post(this.baseUrl+'/payments/saveReceipt', formData)
      .subscribe(
        (response) => {
          console.log('File uploaded successfully!', response);
          
        },
        (error) => {
          console.error('Error uploading file:', error);
        }
      );
  }
}
