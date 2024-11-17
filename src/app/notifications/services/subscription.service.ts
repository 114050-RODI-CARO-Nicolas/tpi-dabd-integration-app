import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Subscription } from '../models/suscriptions/subscription';
import { ContactModel } from '../models/contacts/contactModel';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface ApiSubscriptionUpdate {
  contactId: number;
  subscriptionId: number;
  subscriptionValue: boolean;
}

interface ApiContactResponse {
  id: number;
  subscriptions: string[];
  contact_value: string;
  contact_type: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {




  private http: HttpClient = inject(HttpClient)

  private apiUrl: string = environment.apis.contacts.url;

  getAllSubscriptions(): Observable<Subscription[]> {

    const url = `${environment.apis.contacts.url}/subscriptions`;

    return this.http.get<Subscription[]>(url).pipe(
      map(subscriptions => subscriptions.map(subscription => ({
        ...subscription,
        name: this.getSubscriptionNameInSpanish(subscription.name)
      })))
    );
  }




  updateContactSubscriptions(contact: ContactModel): Observable<ContactModel> {

    return this.getAllSubscriptions().pipe(
      switchMap(availableSubscriptions => {
        return this.getContactSubscriptions(contact.id).pipe(
          switchMap(currentContactResponse => {

            const currentSubscriptionsInEnglish = currentContactResponse.subscriptions.map(spanishName =>
              this.convertToEnglishName(spanishName)
            );
            const newSubscriptionsInEnglish = contact.subscriptions.map(spanishName =>
              this.convertToEnglishName(spanishName)
            );

            const subscriptionToUpdate = availableSubscriptions.find(subscription => {
              const wasSubscribed = currentSubscriptionsInEnglish.includes(subscription.name);
              const isStillSubscribed = newSubscriptionsInEnglish.includes(subscription.name);


              return wasSubscribed && !isStillSubscribed;
            });

            if (!subscriptionToUpdate) {
              console.log('No hay suscripciones para actualizar');
              return of(contact);
            }

            const updateData: ApiSubscriptionUpdate = {
              contactId: contact.id,
              subscriptionId: subscriptionToUpdate.id,
              subscriptionValue: false
            };

            return this.http.put<ApiContactResponse>(
              `${this.apiUrl}/contacts/subscriptions`,
              updateData
            ).pipe(
              map(apiResponse => this.mapApiResponseToContactModel(apiResponse))
            );
          })
        );
      })
    );
  }

  private mapApiResponseToContactModel(apiResponse: ApiContactResponse): ContactModel {
    return {
      id: apiResponse.id,
      subscriptions: apiResponse.subscriptions.map(sub => this.translations[sub] || sub),
      contactValue: apiResponse.contact_value,
      contactType: apiResponse.contact_type === 'EMAIL' ? 'Correo eléctronico' : apiResponse.contact_type,
      active: apiResponse.active,
      showSubscriptions: false
    };
  }

  private convertToEnglishName(spanishName: string): string {
    const reversedTranslations: { [key: string]: string } = {};
    Object.entries(this.translations).forEach(([english, spanish]) => {
      reversedTranslations[spanish] = english;
    });

    return reversedTranslations[spanishName] || spanishName;
  }
  private readonly translations: { [key: string]: string } = {
    'GENERAL': 'General',
    'MODERATION': 'Moderación',
    'CONSTRUCTION': 'Construcción',
    'EMPLOYEE_PAYMENT': 'Pago de Empleados',
    'EXPENSES_EXPIRATION': 'Vencimiento de Gastos',
    'DEBT': 'Deuda',
    'GENERAL_BILL': 'Factura General',
    'PAYMENT': 'Pago',
    'USER': 'Usuario',
    'ASSOCIATED_USER_CREATED': 'Usuario Asociado Creado',
    'WORKER_LATE_DEPARTURE': 'Salida Tardía de Trabajador',
    'INVENTORY': 'Inventario',
    'GENERAL_EXPENSE': 'Gasto General'
  };


  private getContactSubscriptions(contactId: number): Observable<ApiContactResponse> {
    return this.http.get<ApiContactResponse>(
      `${this.apiUrl}/contacts/${contactId}`
    ).pipe(
      map(response => ({
        ...response,
        subscriptions: response.subscriptions.map(sub => this.getSubscriptionNameInSpanish(sub))
      }))
    );
  }




  getSubscriptionNameInSpanish(englishName: string): string {
    const translations: { [key: string]: string } = {
      'GENERAL': 'General',
      'MODERATION': 'Moderación',
      'CONSTRUCTION': 'Construcción',
      'EMPLOYEE_PAYMENT': 'Pago de Empleados',
      'EXPENSES_EXPIRATION': 'Vencimiento de Gastos',
      'DEBT': 'Deuda',
      'GENERAL_BILL': 'Factura General',
      'PAYMENT': 'Pago',
      'USER': 'Usuario',
      'ASSOCIATED_USER_CREATED': 'Usuario Asociado Creado',
      'WORKER_LATE_DEPARTURE': 'Salida Tardía de Trabajador',
      'INVENTORY': 'Inventario',
      'GENERAL_EXPENSE': 'Gasto General'
    };

    return translations[englishName] || englishName;
  }

}









