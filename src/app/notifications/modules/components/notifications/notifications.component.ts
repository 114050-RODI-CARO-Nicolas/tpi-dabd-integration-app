import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/notifications/notification';
import { Router } from '@angular/router';
import { NotificationEventServiceService } from '../../../services/NotificationEventService.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})

export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  selectedNotification: Notification | null = null;
  showNotifications = false;
  showModal = false;

  displayedNotifications: Notification[] = [];
  remainingNotifications: Notification[] = [];

  showModalToRenderHTML: boolean = false;

  clickCount = 0;
  showNotification = false;

  constructor(private router: Router, 
    private notificationService: NotificationService,
    private notificationEventService: NotificationEventServiceService
  ) {}

  @ViewChild('iframePreview', { static: false }) iframePreview!: ElementRef;

  ngOnInit() {
    console.log("button")

    this.notificationEventService.triggerNotification$.subscribe(() => {
      this.toggleNotifications(); 
      console.log("button")


    });
    this.notificationService.getNotificationByContact().subscribe({
      next: (notifications) => {
        this.notifications = notifications.sort((a, b) => {
          return new Date(b.dateSend).getTime() - new Date(a.dateSend).getTime();
        });
        this.displayedNotifications = this.notifications.slice(0, 4);
        this.remainingNotifications = this.notifications.slice(4);
      },
      error: (error) => {
        console.error('Error al cargar las notificaciones', error);
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (!this.showNotifications) {
      this.closeModal();
    }
  }
  


  showNotificationDetails(notification: Notification) {
    // Marca la notificación como leída
    notification.isRead = true;
    this.selectedNotification = notification;
    this.notificationService.isRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        // Llama a previewContent para mostrar el contenido en el iframe
        this.previewContent(notification);
      },
      error: (error) => {
        console.error('Error al actualizar la notificación como leída', error);
      }
    });
  }

  closeModal() {
    this.showModal = false;
    this.selectedNotification = null;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const notificationsWrapper = document.querySelector('.notifications-wrapper');
    if (!notificationsWrapper?.contains(target)) {
      this.showNotifications = false;
    }
  }

  closeModalToRenderHTML(): void {
    this.showModalToRenderHTML = false;
  }

  previewContent(notification: Notification): void {
    this.showModalToRenderHTML = true;
    setTimeout(() => {
      const iframe = this.iframePreview.nativeElement as HTMLIFrameElement;
      iframe.srcdoc = notification.body; // Usa el body de la notificación como contenido del iframe
      iframe.onload = () => {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          const height = iframeDocument.documentElement.scrollHeight;
          iframe.style.height = `${height}px`; // Ajusta la altura del iframe
        }
      };
    }, 5);
  }

  handleDoubleClick() {
    this.clickCount++;
    if (this.clickCount === 2) {
      console.log("doble click")
      this.router.navigate(['/my-notification']);
      this.clickCount = 0;
      console.log(this.clickCount)
    }
  }

  loadMoreNotifications(){
    const nextNotifications = this.remainingNotifications.slice(0, 5);
    this.displayedNotifications = [...this.displayedNotifications, ...nextNotifications];
    this.remainingNotifications = this.remainingNotifications.slice(5); // Elimina las cargadas
    this.handleDoubleClick();

  }
}
