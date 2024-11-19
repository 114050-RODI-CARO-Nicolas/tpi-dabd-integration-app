import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Notification, NotificationKPIViewedModel, NotificationModelChart } from '../models/notifications/notification';
import { forkJoin, map, Observable, switchMap, throwError } from 'rxjs';
import { NotificationFilter } from '../models/notifications/filters/notificationFilter';
import { PageRequest } from '../models/pagination/PageRequest';
import { Page } from '../models/pagination/Page';
import { SessionService } from '../../users/services/session.service';
import { Contact } from '../../inventories/models/contact.model';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiUrl: string;

  constructor(private sessionService : SessionService) {
    
    this.apiUrl = environment.apis.notifications.url;
  }

  private http: HttpClient = inject(HttpClient)

  getNotificationByContact() {
    const user = this.sessionService.getItem('user');
    
    
    const contactId = user?.contacts?.find((contact: any) => contact.contact_type == 'EMAIL')?.id;

    if (!contactId) {
      return throwError(() =>  Error('No contact ID found in session.'));
    }

    const params = new HttpParams().set('contactId', contactId);
    const url = `${this.apiUrl}/notifications`;

    return this.http.get<Notification[]>(url, { params }).pipe(
      switchMap(notifications => {
        const detailedRequests = notifications.map(notification =>
          this.http.get<Notification>(`${this.apiUrl}/notifications/${notification.id}`).pipe(
            map(detailedNotification => ({
              ...notification,
              body: detailedNotification.body || '',
              isRead: notification.statusSend === 'VISUALIZED',
              dateSend: this.convertDate(notification.dateSend),
              dateNotification: new Date().toLocaleDateString()
            }))
          )
        );

        return forkJoin(detailedRequests);
      }),
      map((notificationsWithTemplates) =>
        notificationsWithTemplates.sort((a, b) => b.id - a.id)
      )
    );
  }



  getAllNotification() {
    const url = `${this.apiUrl}/notifications`;
    return this.http.get<Notification[]>(url).pipe(
      switchMap(notifications => {
        const detailedRequests = notifications.map(notification =>
          this.http.get<Notification>(`${this.apiUrl}/notifications/${notification.id}`).pipe(
            map(detailedNotification => ({
              ...notification,
              body: detailedNotification.body || '',
              isRead: notification.statusSend === 'VISUALIZED',
              dateSend: this.convertDate(notification.dateSend),
              dateNotification: new Date().toLocaleDateString()
            }))
          )
        );

        return forkJoin(detailedRequests);
      }),
      map((notificationsWithTemplates) =>
        notificationsWithTemplates.sort((a, b) => b.id - a.id)
      )
    );
  }

  getPaginatedNotifications(filter : NotificationFilter = {}, pageRequest : PageRequest = { page : 1, size: 10 } ) : Observable<Page<Notification>> {

   let params = new HttpParams();

   if (filter.id) params = params.set('id', filter.id.toString());
   if (filter.recipient) params = params.set('recipient', filter.recipient);
   if (filter.viewed !== undefined) params = params.set('viewed', filter.viewed.toString());
   if (filter.subject) params = params.set('subject', filter.subject);
   if (filter.from) params = params.set('from', filter.from);
   if (filter.until) params = params.set('until', filter.until);
   if (filter.contact_id) params = params.set('contact_id', filter.contact_id.toString());
   if (filter.search_term) params = params.set('searchTerm', filter.search_term);

   params = params.set('page', (pageRequest.page ?? 0).toString());
   params = params.set('size', (pageRequest.size ?? 10).toString());

   if (pageRequest.sort?.length) {
    pageRequest.sort.forEach(sortField => {
      params = params.append('sort', sortField);
    });
  }

  return this.http.get<Page<Notification>>(`${this.apiUrl}/notifications/pageable`, { params }).pipe(
    switchMap(page => {
      if(!page.content.length){
        return new Observable<Page<Notification>>(subscriber => subscriber.next(page));
      }

      const detailedRequests = page.content.map(notification =>

        this.http.get<Notification>(`${this.apiUrl}/notifications/${notification.id}`).pipe(
          map(detailedNotification => ({
            ...notification,
            body: detailedNotification.body || '',
            isRead : notification.statusSend === 'VISUALIZED',
            dateSend: this.convertDate(notification.dateSend),
            dateNotification: new Date().toLocaleDateString()
          }))
        )
      )

      return forkJoin(detailedRequests).pipe(
        map(detailedNotifications => ({
          ...page,
          content: detailedNotifications.sort((a, b)=> b.id - a.id)
        }))
      )
    })

  )
  }


  getNotificationById(id: number) {
    const url = `${this.apiUrl}/notifications/${id}`;
    return this.http.get<Notification>(url);
  }


  isRead(id: number) {
    const url = `${this.apiUrl}/notifications/${id}`
    const body = { statusSend: 'VISUALIZED' };
    return this.http.put(url, body)
  }

  private convertDate(date: string | Date): Date {
    if (typeof date === 'string') {
      const [day, month, yearTime] = date.split('/');
      const [year, time] = yearTime.split(' ');
      const [hours, minutes, seconds] = time ? time.split(':') : [0, 0, 0];
      return new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
    }
    return date;
  }

  getAllNotificationsNotFiltered(): Observable<NotificationKPIViewedModel[]> {

    const url = `http://localhost:8011/notifications`;


    return this.http.get<NotificationKPIViewedModel[]>(url);

  }


}
