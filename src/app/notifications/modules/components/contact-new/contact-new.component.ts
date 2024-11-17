import { Component, Inject,inject } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormControl, AbstractControl, ValidationErrors} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactModel } from '../../../models/contacts/contactModel';
import { ContactService } from '../../../services/contact.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { map, Observable, of } from 'rxjs';
import {  } from '@angular/forms';
import { ContactType } from '../../../models/contacts/contactAudit';



@Component({
  selector: 'app-contact-new',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, MainContainerComponent],
  templateUrl: './contact-new.component.html',
  styleUrl: './contact-new.component.css'
})

@Inject('ContactService')
export class ContactNewComponent {


  selectedContactType: string = '';
  email: string = '';
  phone: string = '';
  isModalOpen: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';

  contactService = new ContactService();
  toastService : ToastService = inject(ToastService)

  /*existeUsuario(control: FormControl): Observable<any> { 
    const username = control.value; return this.http.get(`url_para_verificar_username/${username}`);
  }*/


    newContactForm: FormGroup = new FormGroup({
      contactType: new FormControl('', [Validators.required]),
      contactValue: new FormControl('', [Validators.required], [this.checkContactExistsValidator()]),
    //  phone: new FormControl('', [Validators.required, Validators.pattern('[0-9]{10}')]),        //[this.uniqueEmail()]      
    });

    /*formulario: FormGroup;
    constructor(private formBuilder: FormBuilder) {
      this.formulario = this.formBuilder.group({
        contactType: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern('[0-9]{10}')]],
      });
    }*/

      checkContactExists(contact_value : string): Observable<boolean> {
        return this.contactService.getAllContacts().pipe(
          map(response => {
            const aux = response.find(r => r.contactValue === contact_value);
            if(aux){
              return true;
            }
            else{
              return false;
            }
          })
        );
      }

      private checkContactExistsValidator() {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
          const contactValue = control.value;
          if(!contactValue){
            return of(null)
          }
          const respuesta = this.checkContactExists(contactValue)
          return this.checkContactExists(contactValue).pipe(
            map(exists => exists ? { contactExists: true } : null)
          );
        };
    }
    
  onContactTypeChange() {
    this.email = '';
    this.phone = '';
  }

  resetForm() {
    this.newContactForm.reset();
    this.selectedContactType = '';
    this.email = '';
    this.phone = '';
  }

  sendForm() {
    if (this.newContactForm.valid) {

      const contact: ContactModel = {
        id: 1,
        subscriptions: [
          'General',
          'Moderación',
          'Construcción',
          'Pago a empleados',
          'Vencimiento de gastos',
          'Deuda',
          'Factura general',
          'Pago',
          'Usuario',
          'Usuario asociado creado',
          'Salida tardía del trabajador',
          'Inventario',
          'Gasto general'],
        contactValue: this.newContactForm.get('contactValue')?.value,
        contactType: this.newContactForm.get('contactType')?.value,
        active: true,
        showSubscriptions: false
      };        

      /*if(this.contactService.checkContactExists(contact.contactValue)){

        this.toastService.sendError('Ya esta ese contactacto')
        console.error('Error al crear contacto intentar nuevamente:');
        console.log(contact);

      }
        */
      this.contactService.saveContact(contact).subscribe({
        next: (response) => {

          this.toastService.sendSuccess('El contacto ha sido registrado correctamente');
          console.log(contact);


          this.resetForm();
        },
        error: (error: HttpErrorResponse) => {

          this.toastService.sendError('Error al crear contacto porfavor intente nuevamente ')
          console.error('Error al crear contacto intentar nuevamente:', error);
          console.log(contact);
        },
      });


    }


  }

  showModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  showInfo() {
    const message = `
      <strong>Sistema de gestión de contactos</strong><br>
      Aquí puedes registrar un nuevo contacto,.<br><br>
    `;

    this.showModal('Información', message);
  }
}
