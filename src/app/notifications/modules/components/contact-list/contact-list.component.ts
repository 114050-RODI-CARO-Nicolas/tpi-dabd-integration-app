import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ContactService } from '../../../services/contact.service';
import { ContactModel } from '../../../models/contacts/contactModel';
import { Router } from '@angular/router';
import { NgbPagination, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { MainContainerComponent, ToastService, TableFiltersComponent, Filter, FilterConfigBuilder } from 'ngx-dabd-grupo01';
import { SubscriptionService } from '../../../services/subscription.service';
import { concatMap, map, tap } from 'rxjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaginatedContacts } from '../../../models/contacts/paginated/PaginatedContact';
import { TelegramSenderComponent } from '../telegram-sender/telegram-sender.component';
import { ActiveSearchTerm } from '../../../models/contacts/filters/activeSearchTerm';
import { TemplateModel } from '../../../models/templates/templateModel';
import { EmailService } from '../../../services/emailService';
import { TemplateService } from '../../../services/template.service';
import { EmailDataContact } from '../../../models/notifications/emailDataContact';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgbPagination,
    NgbDropdownModule,
    MainContainerComponent,
    TableFiltersComponent,
    TelegramSenderComponent
  ],
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.css'],
  providers: [DatePipe]
})
export class ContactListComponent implements OnInit {
  private router = inject(Router);
  private contactService = inject(ContactService);
  toastService: ToastService = inject(ToastService);
  suscriptionService: SubscriptionService = inject(SubscriptionService);
  isTelegramModalOpen = false;

  availableSubscriptions: string[] = [];

  getSuscriptions() {
    this.suscriptionService
      .getAllSubscriptions()
      .pipe(map((x) => x.map((y) => this.availableSubscriptions.push(y.name))));
  }

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  sizeOptions: number[] = [10, 25, 50];

  // Filtros
  globalSearchTerm = '';
  filteredSearchTerm = '';


  isActiveContactFilter: boolean | undefined = true;
  selectedContactType: string = '';

  // Datos y estados
  contacts: ContactModel[] = [];


  // Estados de modales
  isModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  isDetailModalOpen = false;
  selectedContact: ContactModel | null = null;

  //Estado de filtro de texto; global o filtrado
  activeSearchTerm : ActiveSearchTerm = ActiveSearchTerm.GLOBAL;

  //Envio a varios contactos
  emailService = inject(EmailService)
  templateService = inject(TemplateService)
  selectedContacts : number[] = []
  minimunContacts : boolean = false
  isEmailModalOpen : boolean = false
  emailSubject : string = ""
  emailBody : string = ""
  allTemplates : TemplateModel[] = []
  selectedTemplate : number = 0
  allSelected: boolean = false

  loadTemplates() {
    this.templateService.getAllTemplatesWithoutVariables().subscribe(data => {
      this.allTemplates = data
    })
  }
  selectContact(contactId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement

    if (inputElement && inputElement.checked !== undefined) {
      const isSelected = inputElement.checked;

      // Si el checkbox está seleccionado, agregar el contacto al array
      if (isSelected) {
        this.selectedContacts.push(contactId);

      } else {
        // Si el checkbox está desmarcado, eliminar el contacto del array

        const index = this.selectedContacts.indexOf(contactId);
        if (index > -1) {
          this.selectedContacts.splice(index, 1);
        }
      }
    }

    this.minimunContacts = this.selectedContacts.length >= 2;
  }
  openEmailModal() {
    this.isEmailModalOpen = true
  }
  closeEmailModal() {
    this.isEmailModalOpen = false
  }
  sendEmail() {
    const data : EmailDataContact = {
      subject: this.emailSubject,
      variables: [],
      templateId: this.selectedTemplate,
      contactIds: this.selectedContacts
    }
    this.emailService.sendEmailWithContacts(data).subscribe({
      next: () => {
        this.isEmailModalOpen = false
        this.loadContacts()
        this.toastService.sendSuccess("Enviado correctamente a los contactos")
      },
      error: (error) => {
        console.error(error)
        this.isEmailModalOpen = false
        this.loadContacts()
        this.toastService.sendError("Hubo un error al enviar a los contactos")
      }
    })
  }
  showNameById(id: number) {
    let name
    name = this.contacts.find(c => c.id === id)?.contactValue
    return name
  }
  selectAllContacts() {
    if (!this.allSelected) {
      this.minimunContacts = true
      this.allSelected = true
      this.selectedContacts = this.contacts.map(contact => contact.id);
    } else {
      this.minimunContacts = false
      this.allSelected = false
      this.selectedContacts = [];
    }
    this.updateSelectAllStatus();
  }
  updateSelectAllStatus() {
    this.allSelected = this.contacts.length === this.selectedContacts.length;
  }
  isContactSelected(contactId: number): boolean {
    return this.selectedContacts.includes(contactId);
  }
  //Envio a varios contactos





  filterConfig : Filter[] = new FilterConfigBuilder()
  .textFilter('Refinar búsqueda', 'filteredSearch', 'Buscar...')
  .selectFilter('Estado', 'status', 'Seleccione un estado', [
    {value: 'ALL', 'label': 'Todos' },
    {value: 'ACTIVE', label: 'Activos'},
    {value: 'INACTIVE', label: 'Inactivos'}
  ])
  .selectFilter('Tipo', 'contactType', 'Seleccione un tipo de contacto', [
    {value: 'EMAIL', label: 'Correo electrónico'},
    {value: 'PHONE', label: 'Teléfono'},
    {value: 'SOCIAL_MEDIA_LINK', label: 'Red social'}
  ])
  .build();



  // Referencias
  @ViewChild('editForm') editForm!: NgForm;
  contactToDelete: ContactModel | null = null;
  editingContact: ContactModel = this.getEmptyContact();

  constructor() {
    this.initializePagination();
  }

  ngOnInit(): void {
    this.loadContacts();
    this.loadTemplates()
  }



  private getEmptyContact(): ContactModel {
    return {
      id: 0,
      subscriptions: [],
      contactValue: '',
      contactType: '',
      active: true,
      showSubscriptions: false,
    };
  }




  filterChange($event: Record<string, any>) {
    this.clearFilters();
    if($event['status']  && $event['status'].trim() !== '' ) {
      if($event['status']==='ACTIVE'){
        this.isActiveContactFilter = true;

     } else if ($event['status']==='INACTIVE' ) {
       this.isActiveContactFilter = false;
     } else {
       this.isActiveContactFilter = undefined;
     }
    }

    if($event['contactType']  && $event['contactType'].trim() !== '' ) {
      this.selectedContactType = $event['contactType']
    }

    if($event['filteredSearch']  && $event['filteredSearch'].trim() !== '' ) {
      this.activeSearchTerm = ActiveSearchTerm.FILTERED;
      this.filteredSearchTerm = $event['filteredSearch']
    }

    this.applyFilters();


  }

  private applyFilters() {
    this.currentPage = 1; // Resetear a la primera página al filtrar
    this.loadContacts(
      this.isActiveContactFilter,
      this.activeSearchTerm === ActiveSearchTerm.FILTERED ? this.filteredSearchTerm : this.globalSearchTerm ,
      this.selectedContactType
    );
  }




  onGlobalSearchTextChange(searchTerm: string) {
    this.activeSearchTerm = ActiveSearchTerm.GLOBAL;
    this.globalSearchTerm = searchTerm;
    this.applyFilters();
  }







  // Carga de datos
  loadContacts(active?: boolean, searchText?: string, contactType?: string) {
    this.contactService.getPaginatedContacts(this.currentPage, this.pageSize, active, searchText, contactType).subscribe(
      (response: PaginatedContacts) => {
        this.contacts = response.content; // Asigna los contactos paginados
        this.totalItems = response.totalElements; // Total de elementos
        this.totalPages = response.totalPages; // Total de páginas
      },
      error => {
        console.error('Error fetching contacts:', error);
      }
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadContacts(this.isActiveContactFilter, this.globalSearchTerm, this.selectedContactType);
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadContacts(this.isActiveContactFilter, this.globalSearchTerm, this.selectedContactType);
    }
  }



  clearFilters() {
    this.activeSearchTerm = ActiveSearchTerm.GLOBAL;
    this.filteredSearchTerm = '';
    this.globalSearchTerm = '';
    this.selectedContactType = '';
    this.isActiveContactFilter = true;
    this.currentPage = 1;
  }

  // Paginación
  initializePagination() {
    this.updatePagination();
  }

  updatePagination() {
    this.totalItems = this.contacts.length;
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadContacts();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadContacts();
  }



  saveContact() {
    this.router.navigate(['notifications/contact/new']);
  }

  editContact(contact: ContactModel) {


    this.contactService.updateContact(contact).pipe(
      tap(updateResponse => {
        const index = this.contacts.findIndex((c) => c.id === contact.id);
        if (index !== -1) {
          this.contacts[index] = { ...contact };
        }
      }),

      concatMap(() => {

        return this.suscriptionService.updateContactSubscriptions(contact).pipe(
          tap(response => console.log('', response)  )
        );
      })
    ).subscribe({
      next: (finalResponse) => {

        this.closeEditModal();
        this.toastService.sendSuccess(
          'Éxito: El contacto y sus suscripciones han sido actualizados correctamente'
        );
      },
      error: (error: HttpErrorResponse) => {

        this.toastService.sendError(
          'Error: Ha ocurrido un error al intentar actualizar el contacto. Intente nuevamente...'
        );
        this.closeEditModal();
      },
      complete: () => {

      }
    });
  }

  deleteContact(contact: ContactModel) {
    this.contactService.deleteContact(contact.id).subscribe({
      next: () => {
        this.contacts = this.contacts.filter((c) => c.id !== contact.id);
        this.closeDeleteModal();
        this.toastService.sendSuccess(
          'Éxito El contacto ha sido eliminado correctamente'
        );

        this.initializePagination();
      },
      error: (error: HttpErrorResponse) => {
        this.closeDeleteModal();
        this.toastService.sendError(
          'Error Ha ocurrido un error al intentar eliminar el contacto intente nuevamente...'
        );
        console.error('Error al eliminar el contacto:', error);
      },
    });
  }

  // Modal handlers
  showModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  openEditModal(contact: ContactModel) {
    this.editingContact = { ...contact }; // Copia el contacto a editar
    this.isEditModalOpen = true;

    // Cargar las suscripciones disponibles si aún no se han cargado
    if (this.availableSubscriptions.length === 0) {
      this.loadSubscriptions();
    }
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingContact = {
      id: 0,
      subscriptions: [],
      contactValue: '',
      contactType: '',
      active: true,
      showSubscriptions: false,
    };
  }

  isSubscribed(subscription: string): boolean {
    return this.editingContact.subscriptions?.includes(subscription) || false;
  }

  toggleSubscription(subscription: string) {
    if (!this.editingContact.subscriptions) {
      this.editingContact.subscriptions = [];
    }

    const index = this.editingContact.subscriptions.indexOf(subscription);
    if (index !== -1) {
      this.editingContact.subscriptions.splice(index, 1);
    } else {
      this.editingContact.subscriptions.push(subscription);
    }
  }


  loadSubscriptions() {
    this.suscriptionService.getAllSubscriptions()
      .pipe(
        map(subscriptions => subscriptions.map(sub => sub.name))
      )
      .subscribe({
        next: (subscriptionNames) => {
          this.availableSubscriptions = subscriptionNames;
        },
        error: (error) => {
          console.error('Error al cargar suscripciones:', error);
          this.toastService.sendError('Error al cargar las suscripciones');
        }
      });
  }

  openDetailModal(contact: ContactModel) {
    if (contact) {
      this.selectedContact = { ...contact };
      this.isDetailModalOpen = true;
    }
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedContact = null;
  }

  openDeleteModal(contact: ContactModel) {
    this.contactToDelete = contact;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.contactToDelete = null;
  }

  confirmDelete() {
    if (this.contactToDelete) {
      this.deleteContact(this.contactToDelete);
    }
  }

  saveEditedContact() {
    if (this.editForm.form.valid) {
      this.editContact(this.editingContact);
    }
  }

  exportToExcel() {
    // Implementar la lógica de exportación a Excel
    this.contactService.getAllContacts().subscribe({
      next: (contacts) => {
        const data = contacts.map((contact) => ({
          Tipo: contact.contactType,
          Valor: contact.contactValue,
          Activo: contact.active ? 'Activo' : 'Inactivo',
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
        const now = new Date();
        const dateTime = `${now
          .toLocaleDateString()
          .replace(/\//g, '-')}_${now.getHours()}-${now.getMinutes()}`;
        const fileName = `Contactos-${dateTime}.xlsx`; // Nombre del archivo
        XLSX.writeFile(wb, fileName);
      },
      error: (error) => {
        this.showModal('Error', 'Error al cargar los contactos para exportar');
      },
    });
  }

  exportToPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Contactos', 14, 20);

    this.contactService.getAllContacts().subscribe({
      next: (contacts) => {
        autoTable(doc, {
          startY: 30,
          head: [['Tipo', 'Valor', 'Activo']],
          body: contacts.map((contact) => [
            contact.contactType,
            contact.contactValue,
            contact.active ? 'Activo' : 'Inactivo',
          ]),
          columnStyles: {
            // para que no se rompa por si el body es muy grande
            0: { cellWidth: 40 }, // Tipo
            1: { cellWidth: 100 }, // Valor
            2: { cellWidth: 20 }, // Activo
          },
          styles: { overflow: 'linebreak' },
        });
        const now = new Date();
        const dateTime = `${now
          .toLocaleDateString()
          .replace(/\//g, '-')}_${now.getHours()}-${now.getMinutes()}`;
        const fileName = `Contactos-${dateTime}.pdf`;

        doc.save(fileName);
        console.log('PDF generado');
      },
      error: (error) => {
        this.showModal(
          'Error',
          'Error al cargar los contactos para generar el PDF'
        );
      },
    });
  }

  showInfo() {
    const message = `
      <strong>Sistema de gestión de contactos</strong><br>
      Aquí puedes administrar todos los contactos del sistema.<br><br>

      <strong>Iconografía:</strong><br>
      Activos: <i class="bi bi-check2-circle text-success large-icon"></i><br>
      Inactivos: <i class="bi bi-x-circle text-danger large-icon"></i>
    `;

    this.showModal('Información', message);
  }

  openTelegramModal() {
    this.isTelegramModalOpen = true;
  }

  closeTelegramModal() {
    this.isTelegramModalOpen = false;
  }
}
