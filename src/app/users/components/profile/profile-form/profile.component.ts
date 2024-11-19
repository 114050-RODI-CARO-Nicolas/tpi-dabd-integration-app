import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { NgClass } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { PlotService } from '../../../services/plot.service';
import { Address, Contact } from '../../../models/owner';
import { SessionService } from '../../../services/session.service';
import { User } from '../../../models/user';
import { Country, Provinces } from '../../../models/generics';
import { toSnakeCase } from '../../../utils/owner-helper';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InfoComponent } from '../../commons/info/info.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, MainContainerComponent, NgClass],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private userService = inject(UserService);
  private roleService = inject(RoleService)
  private plotService = inject(PlotService)
  private activatedRoute = inject(ActivatedRoute)
  private router = inject(Router)
  private toastService = inject(ToastService)
  private sessionService = inject(SessionService)
  private modalService = inject(NgbModal);

  id!: number;
  user: any = {};
  contact!: Contact;
  contacts: Contact[] = [];
  contactIndex: number | undefined = undefined;
  provinceOptions!: any;
  countryOptions!: any;
  address!: Address;
  addresses: Address[] = [];
  addressIndex: number | undefined = undefined;

  userForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email, Validators.maxLength(50)],
    }),
    userName: new FormControl('', [Validators.required, Validators.maxLength(50)]),

    contactsForm: new FormGroup({
      contactType: new FormControl('', []),
      contactValue: new FormControl('', []),
    }),
    addressForm: new FormGroup({
      streetAddress: new FormControl('', [Validators.required]),
      number: new FormControl(0, [Validators.required, Validators.min(0)]),
      floor: new FormControl(0),
      apartment: new FormControl(''),
      city: new FormControl('', [Validators.required]),
      province: new FormControl('', [Validators.required]),
      country: new FormControl('', [Validators.required]),
      postalCode: new FormControl('', [Validators.required]),
    }),
  });


  setEnums() {
    this.provinceOptions = Object.entries(Provinces).map(([key, value]) => ({
      value: key,
      display: value
    }));
    this.countryOptions = Object.entries(Country).map(([key, value]) => ({
      value: key,
      display: value
    }));
  }

  setEditValues() {
    if (this.id) {
      this.userService.getUserById(Number(this.id)).subscribe(
        response => {
          console.log(response)
          this.user = response;

          this.userForm.patchValue({
            email: this.user.email,
            userName: this.user.userName,
          });

          if (this.user.addresses) {
            this.addresses = [...this.user.addresses];
          }

          if (this.user.contacts) {
            this.contacts = [...this.user.contacts];
          }
        },
        error => {
          this.toastService.sendError('Error al obtener el usuario.')
        }
      );
    }
  }
  get isArgentinaSelected(): boolean {
    return this.userForm.get('addressForm')?.get('country')?.value === 'ARGENTINA';
  }
  //#region FUNCION CONTACTO
  setContactValue(index: number) {
    const contact = this.contacts[index];
    console.log(contact)
    if (contact) {
      const contactFormGroup = this.userForm.get('contactsForm') as FormGroup;

      contactFormGroup.patchValue({
        contactType: contact.contactType,
        contactValue: contact.contactValue,
      })

      this.contactIndex = index;
    }
  }

  getContactsValues(): Contact {
    const contactFormGroup = this.userForm.get('contactsForm') as FormGroup;
    return {
      contactType: contactFormGroup.get('contactType')?.value || '',
      contactValue: contactFormGroup.get('contactValue')?.value || '',
    };
  }

  addContact(): void {
    if (this.userForm.get('contactsForm')?.valid) {
      const contactValues = this.getContactsValues();
      if (this.contactIndex == undefined && contactValues) {
        this.contacts.push(contactValues);
      } else if (contactValues && this.contactIndex !== undefined) {
        this.contacts[this.contactIndex] = contactValues;
        this.contactIndex = undefined;
      }
      this.userForm.get('contactsForm')?.reset();
    } else {
      this.toastService.sendError("Contacto no válido.")
    }
  }

  cancelEditContact() {
    this.userForm.get('contactsForm')?.reset();
    this.contactIndex = undefined;
  }

  removeContact(index: number): void {
    this.contacts.splice(index, 1);
  }
  //#endregion

  //#region FUNCION ADDRESS
  removeAddress(index: number): void {
    if (this.id === null) {
      this.addresses.splice(index, 1);
    } else {

    }
  }

  getAddressValue(): Address {
    const postalCodeValue = this.userForm.get('addressForm.postalCode')?.value;
    const address: Address = {
      streetAddress:
        this.userForm.get('addressForm.streetAddress')?.value || '',
      number: this.userForm.get('addressForm.number')?.value || 0,
      floor: this.userForm.get('addressForm.floor')?.value || 0,
      apartment: this.userForm.get('addressForm.apartment')?.value || '',
      city: this.userForm.get('addressForm.city')?.value || '',
      province: this.userForm.get('addressForm.province')?.value || '',
      country: this.userForm.get('addressForm.country')?.value || '',
      postalCode: postalCodeValue ? parseInt(postalCodeValue, 10) : 0
    };
    return address;
  }

  setAddressValue(index: number) {
    const address = this.addresses[index];

    if (address) {
      const addressFormGroup = this.userForm.get('addressForm') as FormGroup;

      addressFormGroup.patchValue({
        streetAddress: address.streetAddress,
        number: address.number,
        floor: address.floor,
        apartment: address.apartment,
        city: address.city,
        province: address.province,
        country: address.country,
        postalCode: address.postalCode
      });
      this.addressIndex = index;
    }
  }

  addAddress(): void {
    if (this.userForm.get('addressForm')?.valid) {
      const addressValue = this.getAddressValue()
      if (this.addressIndex == undefined && addressValue) {
        this.addresses.push(addressValue);
      } else if (addressValue && this.addressIndex !== undefined) {
        this.addresses[this.addressIndex] = addressValue;
        this.addressIndex = undefined;
      }
      this.userForm.get('addressForm')?.reset();
    } else {
      this.toastService.sendError("Direccion no válida.")
    }
  }

  cancelEditionAddress() {
    this.addressIndex = undefined;
    this.userForm.get('addressForm')?.reset();
  }
  //#endregion

  hasContactEmail():boolean{
    let hasEmail= this.contacts.filter(c => c.contactType === "EMAIL")
    return hasEmail !== null && hasEmail.length > 0;
  }

  //#region ON SUBMIT
  onSubmit(): void {
    if (this.addresses.length <= 0) {
      this.toastService.sendError("Debes cargar al menos una dirección")
    } if(this.addresses.length <= 0) {
      this.toastService.sendError("Debes cargar al menos una dirección")
      return;
    } else if(this.contacts.length <= 0) {
      this.toastService.sendError("Debes cargar al menos un contacto")
      return;
    } else if (!this.hasContactEmail()) {
      this.userForm.markAllAsTouched();
      this.toastService.sendError("Debes agregar al menos un email de contacto");
      return;
    } else {
      if (this.isFormValid()) {
        this.updateUser()
      }
    }
  }

  isFormValid() {
    if (this.userForm.controls['email'].errors ||
      this.userForm.controls['userName'].errors) {
      return false
    } else {
      return true
    }
  }
  //#endregion

  //#region CREATE / UPDATE
  fillUser() {
    this.user.id = this.id ? this.id : undefined;
    (this.user.userName = this.userForm.get('userName')?.value || ''),
      (this.user.email = this.userForm.get('email')?.value || ''),
      (this.user.contacts = [...this.contacts]),
      (this.user.addresses = [...this.addresses]);
  }
  transformRoles(user: User): number[] | undefined {
    return user.roles?.map(role => role.code);
  }
  updateUser() {
    this.fillUser();
    if (this.user.id) {
      this.user.roles = this.transformRoles(this.user)
      delete this.user.createdDate
      const [day, month, year] = this.user.birthdate.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      this.user.birthdate = formattedDate
      this.userService.updateUser(this.id, toSnakeCase(this.user)).subscribe({
        next: (response) => {
          this.toastService.sendSuccess("Usuario actualizado con éxito")
          //todo navigate to profile
          this.router.navigate(['']);
        },
        error: (error) => {
          this.toastService.sendError("Error actualizado el usuario")
        },
      });
    } else {
      this.toastService.sendError("Algo salió mal")
    }
  }
  //#endregion


  //#region RUTEO | CANCELAR
  cancel() {
    //TODO navigate to profile
    this.router.navigate(["users/profile/detail"])
  }
  //#endregion

  ngOnInit(): void {

    this.id = this.getUserId()
    this.setEnums()

    if (this.id !== null) {
      this.setEditValues();
    }
  }

  getUserId() {
    let user: User = this.sessionService.getItem('user')

    return user.id!!
  }


  openInfo(){
    const modalRef = this.modalService.open(InfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true
    });

    modalRef.componentInstance.title = 'Editar información del perfil del usuario';
    modalRef.componentInstance.description = 'Esta pantalla se utiliza para editar la información de usuario.';
    modalRef.componentInstance.body = [
      {
        title: 'Datos',
        content: [
          {
            strong: 'Email:',
            detail: 'Campo para modificar el email del usuario.'
          },
          /* {
            strong: 'Nombre:',
            detail: 'Nombre del usuario.'
          }, */
          {
            strong: 'Nombre de Usuario:',
            detail: 'Campo para modificar el nombre de usuario.'
          },
          /* {
            strong: 'Apellido:',
            detail: 'Apellido del usuario.'
          }, */
        ]
      },
      {
        title: 'Dirección',
        content: [
          {
            strong: 'Calle:',
            detail: 'Campo para modificar el nombre de la calle.'
          },
          {
            strong: 'Número:',
            detail: 'Campo para modificar el número, con valor predeterminado 0.'
          },
          {
            strong: 'Piso:',
            detail: 'Campo para modificar el piso, con valor predeterminado 0.'
          },
          {
            strong: 'Depto:',
            detail: 'Campo para modificar el número de departamento.'
          },
          {
            strong: 'País:',
            detail: 'Menú desplegable para seleccionar el país.'
          },
          {
            strong: 'Provincia:',
            detail: 'Menú desplegable para seleccionar la provincia.'
          },
          {
            strong: 'Ciudad:',
            detail: 'Campo para modificar la ciudad.'
          },
          {
            strong: 'Código Postal:',
            detail: 'Campo para modificar el código postal.'
          }
        ]
      },
      {
        title: 'Contactos',
        content: [
          {
            strong: 'Tipo Contacto:',
            detail: 'Menu desplegable para seleccionar el tipo de contacto.'
          },
          {
            strong: 'Contacto:',
            detail: 'Campo para ingresar el valor del contacto.'
          }
        ]
      },
      {
        title: 'Funcionalidades de los botones',
        content: [
          {
            strong: 'Guardar:',
            detail: 'Botón azul para confirmar la edición de la información de perfil.'
          },
          {
            strong: 'Cancelar:',
            detail: 'Botón rojo para cancelar la edición de la información de perfil.'
          },
        ]
      }
    ];
    modalRef.componentInstance.notes = [
      'La interfaz está diseñada para ofrecer una administración eficiente de los procesos de validación de usuarios.'
    ];
  }


}
