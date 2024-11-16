import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationEventServiceService {

  private triggerNotificationSubject = new Subject<void>();
  triggerNotification$ = this.triggerNotificationSubject.asObservable();

  // Método para emitir el evento
  triggerNotifications() {
    this.triggerNotificationSubject.next();
  }

}
