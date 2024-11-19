import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Notification } from '../../../models/notifications/notification';
import { Filter, FilterConfigBuilder, MainContainerComponent, TableFiltersComponent, ToastService } from 'ngx-dabd-grupo01';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NotificationService } from '../../../services/notification.service';


@Component({
  selector: 'app-my-notification',
  standalone: true,
  imports: [CommonModule, NgbPagination, MainContainerComponent, FormsModule, TableFiltersComponent],
  providers: [DatePipe],
  templateUrl: './my-notification.component.html',
  styleUrl: './my-notification.component.css'
})
export class MyNotificationComponent implements OnInit {

  private toastService = inject(ToastService);

  notifications: Notification[] = [];
  selectedNotification?: Notification;
  filteredNotifications: Notification[] = [];

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  sizeOptions: number[] = [10, 25, 50];

  // Modal Info
  modalTitle = '';
  modalMessage = '';
  isModalOpen = false;

  // Modal Noti
  modalTitleNoti = '';
  modalMessageNoti = '';
  isModalOpenNoti = false;
  showModalToRenderHTML: boolean = false;

  // Filtros
  globalSearchTerm = '';
  statusFilter: string = '';
  dateFrom: string = '';
  dateUntil: string = '';

  //Dropdown filters

  notificationSubjectFilter: string = '';

  private notificationService = inject(NotificationService);
  @ViewChild('iframePreview', { static: false }) iframePreview!: ElementRef;

  ngOnInit(): void {

    this.loadNotifications();

  }

  constructor() {
    this.initializePagination();
  }

  loadNotifications(): void {
    this.notificationService.getNotificationByContact()
      .subscribe(
        {
          next: (response) => {
            this.notifications = response;
            this.filteredNotifications = [...this.notifications];
            this.totalItems = this.filteredNotifications.length;
          },
          error: (err) => {
            console.log("Error al cargar las notificacione")
            this.toastService.sendError("No se encontró un contacto válido en el usuario con la sesión inicada.")
          }
        }
      );
  

  }


  

  filterConfig: Filter[] = new FilterConfigBuilder()
.textFilter('Asunto', 'subject', "Buscar por asunto...")
.selectFilter('Estado', 'statusSend', 'Seleccione un estado', [
  {value: 'ALL', label: 'Todas'},
  {value: 'SENT', label: 'Enviadas'},
  {value: 'VISUALIZED', label: 'Vistas'}
])
.dateFilter("Fecha desde:", "dateFrom", "Fecha:"  )
.dateFilter("Fecha hasta:", "dateUntil", "Fecha:"  )
.build();

formatDateToISOStart = (dateString: string): string => {
  if (!dateString) return '';
  // Toma la fecha del datepicker y le agrega el tiempo al inicio del día (00:00:00)
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

 formatDateToISOEnd = (dateString: string): string => {
  if (!dateString) return '';
  // Toma la fecha del datepicker y le agrega el tiempo al final del día (23:59:59)
  const date = new Date(dateString);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};


filterChange(filters: Record<string, any>): void {

  
  this.filteredNotifications = this.notifications.filter(notification => {
    const subjectMatch = !filters['subject'] || notification.subject.toLowerCase().includes(filters['subject'].toLowerCase());
    const statusMatch = !filters['statusSend'] || filters['statusSend'] === "ALL" || notification.statusSend === filters['statusSend'];

    const notificationDateISO = new Date(notification.dateSend).toISOString().split('T')[0];
    const dateFromISO = filters['dateFrom'] ? new Date(filters['dateFrom']).toISOString().split('T')[0] : null;
    const dateUntilISO = filters['dateUntil'] ? new Date(filters['dateUntil']).toISOString().split('T')[0] : null;

    const dateFromMatch = !dateFromISO || notificationDateISO >= dateFromISO;
    const dateUntilMatch = !dateUntilISO || notificationDateISO <= dateUntilISO;

  
    return subjectMatch && statusMatch && dateFromMatch && dateUntilMatch;
  });

  this.totalItems = this.filteredNotifications.length;

}



clearFilters(): void {
  this.notificationSubjectFilter = '';
  this.dateFrom = '';
  this.dateUntil = '';
  this.statusFilter = ''
  this.globalSearchTerm = '';
  this.currentPage = 1;
  this.loadNotifications();
}

onGlobalSearchTextChange(searchTerm: string) {
  this.filteredNotifications = this.notifications.filter(item =>
    item.statusSend.toLowerCase().includes(searchTerm) ||
    item.subject.toLowerCase().includes(searchTerm)

  );
}

  exportToExcel(): void {
    const data = this.filteredNotifications.map((notification) => ({
      Usuario: notification.recipient,
      'Asunto': notification.templateName,
      Fecha: notification.dateSend,
      Estado: notification.statusSend === "VISUALIZED" ? "VISTO" : "PENDIENTE",
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notificaciones');
    const now = new Date();
    const dateTime = `${now.toLocaleDateString().replace(/\//g, '-')}_${now.getHours()}-${now.getMinutes()}`;
    const fileName = `Notificaciones-${dateTime}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportToPDF(): void {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Notificaciones', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Usuario', 'Asunto', 'Fecha', 'Estado']],
      body: this.filteredNotifications.map((notification) => [
        notification.recipient,
        notification.templateName,
        new Date(notification.dateSend).toLocaleDateString() + ' ' + new Date(notification.dateSend).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notification.statusSend === "VISUALIZED" ? "VISTO" : "PENDIENTE",
      ]),
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
      },
      styles: { overflow: 'linebreak' },
    });
    const now = new Date();
    const dateTime = `${now.toLocaleDateString().replace(/\//g, '-')}_${now.getHours()}-${now.getMinutes()}`;
    //seteamos nombre pdf
    const fileName = `Notificaciones-${dateTime}`;
    doc.save(fileName+".pdf");
  }

  initializePagination() {
    this.updatePagination();
  }

  updatePagination() {
    this.totalItems = this.notifications.length;
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadNotifications();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadNotifications();
  }

  // Modal handlers
  showModalInfo(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }

  showModalNoti(title: string, message: string) {
    this.modalTitleNoti = title;
    this.modalMessageNoti = message;
    this.isModalOpenNoti = true;
  }

  verNotification(notification: Notification): void {
    this.selectedNotification = notification;
    const message = notification.body;
    this.isModalOpenNoti = true;
    this.showModalNoti(notification.subject, message);
  }

  showInfo() {
    const message = `
      <strong>Sistema de control de notificaciones</strong><br>
      Aquí puedes visualizar todos las notificaciones del sistema.<br><br>
      <strong>Iconografía:</strong><br>
      Visto: <i class="bi bi-check2-circle text-success large-icon"></i><br>
      No visto: <i class="bi bi-x-circle text-danger large-icon"></i><br>
      Ver: <i class="bi bi-eye text-info" style="font-size: 1.3rem; color:info"></i>
    `;
    this.showModalInfo('Información', message);
  }

  // Pagination
  get paginatedNotifications() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredNotifications.slice(startIndex, endIndex);
  }

  previewContent(notification: Notification): void {
    // Llamar al método isRead para marcar la notificación como leída
    this.notificationService.isRead(notification.id).subscribe(
      () => {
        // Si la actualización fue exitosa, continúa mostrando el contenido
        this.showModalToRenderHTML = true;
        this.selectedNotification = notification;

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
      },
      (err) => {
        console.error("Error al marcar la notificación como leída", err);
        // Maneja el error si es necesario
      }
    );
  }

  // Cierra los modales
  closeModal(): void {
    this.isModalOpen = false;
    this.isModalOpenNoti = false;
    this.selectedNotification = undefined;
  }

  closeModalToRenderHTML(): void {
    this.showModalToRenderHTML = false;
  }
}
