import { Component, inject } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { emailValidator } from '../../../validators/email-unique-validator';
import { Address, Contact } from '../../../models/owner';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../models/role';
import { toSnakeCase } from '../../../utils/owner-helper';
import { plotForOwnerValidator } from '../../../validators/cadastre-plot-for-owner';
import { PlotService } from '../../../services/plot.service';
import { Plot } from '../../../models/plot';
import { Country, Provinces } from '../../../models/generics';
import { User } from '../../../models/user';
import { NgClass } from '@angular/common';
import { InfoComponent } from '../../commons/info/info.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {OwnerPlotService} from '../../../services/owner-plot.service';
import {plotForUserValidator} from '../../../validators/cadastre-plot-for-users';
import {birthdateValidation} from '../../../validators/birthdate.validations';
import { SessionService } from '../../../services/session.service';

@Component({
  selector: 'app-user-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, MainContainerComponent, NgClass],
  templateUrl: './user-user-form.component.html',
  styleUrl: './user-user-form.component.css'
})
export class UserUserFormComponent {
    //#region SERVICIOS
    private userService = inject(UserService);
    private roleService = inject(RoleService)
    private plotService = inject(PlotService)
    private ownerPlotService = inject(OwnerPlotService)
    private activatedRoute = inject(ActivatedRoute)
    private router = inject(Router)
    private toastService = inject(ToastService)
    private modalService = inject(NgbModal)
    private sessionService = inject(SessionService)
    //#endregion

    //#region ATT
    id: string | null = null;
    user : any = {};
    address!: Address;
    addresses: Address[] = [];
    addressIndex:number | undefined = undefined;
    contact!: Contact;
    contacts: Contact[] = [];
    contactIndex:number | undefined = undefined;
    rol!: Role;
    plot! : Plot;
    roles: any[] = []
    rolesForCombo : Role[] = []
    provinceOptions!: any;
    countryOptions!: any;
    editMode: boolean = false;
    emailInput: string = ""
    isSuperAdmin: boolean = false;
    adminRoles: number[] = [999];
    //#endregion

  onEmailChange(userEmail: string): void {
    if (this.userForm.controls["email"].valid) {
      const index = this.contacts.findIndex(contact => contact.contactValue === userEmail);

      let userContactEmail : Contact = {
        contactValue: userEmail,
        contactType: "EMAIL"
      }

      if (index !== -1) {
        this.contacts[index] = userContactEmail;
      } else {
        this.contacts.push(userContactEmail);
      }
    }
  }

    //#region FORMULARIO REACTIVO
    userForm = new FormGroup({
      email: new FormControl('', {
        validators: [Validators.required, Validators.email, Validators.maxLength(50)],
      }),
      firstName: new FormControl('', [Validators.required, Validators.maxLength(50)]), // Cambiado
      lastName: new FormControl('', [Validators.required, Validators.maxLength(50)]), // Cambiado
      userName: new FormControl('', [Validators.required, Validators.maxLength(50)]), // Cambiado
      documentType: new FormControl('', [Validators.required]),
      documentNumber: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      birthdate: new FormControl('', [Validators.required, birthdateValidation]),

      rolesForm: new FormGroup({
        rol: new FormControl('', []),
      }),

      contactsForm: new FormGroup({
        contactType: new FormControl('', []),
        contactValue: new FormControl('', []),
      }),
      addressForm: new FormGroup({
        streetAddress: new FormControl('', [Validators.required]),
        number: new FormControl(0, [Validators.required, Validators.min(0)]),
        floor: new FormControl(0),
        apartment: new FormControl(''),
        city: new FormControl('Córdoba', [Validators.required]),
        province: new FormControl('CORDOBA', [Validators.required]),
        country: new FormControl('ARGENTINA', [Validators.required]),
        postalCode: new FormControl(5000, [Validators.required]),
      }),
    });
    //#endregion

  hasContactEmail():boolean{
    let hasEmail= this.contacts.filter(c => c.contactType === "EMAIL")
    return hasEmail !== null && hasEmail.length > 0;
  }

    //#region ON SUBMIT
    onSubmit(): void {

      // debe tener al menos una direccion
      if(this.addresses.length <= 0) {
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
          this.id === null ? this.createUser() : this.updateUser()

        } else {
          this.toastService.sendError("Tienes errores en el formulario");
          this.userForm.controls['email'].markAsTouched();
          this.userForm.controls['firstName'].markAsTouched();
          this.userForm.controls['lastName'].markAsTouched();
          this.userForm.controls['userName'].markAsTouched();
          this.userForm.controls['documentType'].markAsTouched();
          this.userForm.controls['documentNumber'].markAsTouched();
          this.userForm.controls['birthdate'].markAsTouched();

        }
      }
    }

    isFormValid(){
      if(this.userForm.controls['email'].errors ||
      this.userForm.controls['firstName'].errors ||
      this.userForm.controls['lastName'].errors ||
      this.userForm.controls['userName'].errors ||
      this.userForm.controls['documentType'].errors ||
      this.userForm.controls['documentNumber'].errors ||
      this.userForm.controls['birthdate'].errors) {
        return false
      } else {
        return true
      }
    }

    //#endregion

    //#region ngOnInit
    ngOnInit(): void {
      this.id = this.activatedRoute.snapshot.paramMap.get('id');
      if (this.id !== null) {
        this.userForm.controls['email'].disable();
        this.editMode = true
        this.setEditValues();
      } else {
        this.userForm.controls['email'].setAsyncValidators(emailValidator(this.userService))
      }
      this.setEnums()
      this.checkVisibility();
      this.getAllRoles()
    }

    setEnums(){
      this.provinceOptions = Object.entries(Provinces).map(([key, value]) => ({
        value: key,
        display: value
      }));
      this.countryOptions = Object.entries(Country).map(([key, value]) => ({
        value: key,
        display: value
      }));
    }

    setContactType(contactType: string | undefined) {
      switch(contactType){
        case "PHONE":
          return "Teléfono";
        case "EMAIL":
          return "Email";
        case "SOCIAL_MEDIA_LINK":
          return "Link red social";
        default:
          return "Otro";
      }
    }

    //#endregion

    //#region SETEAR VALORES AL FORM
    setEditValues() {
      if (this.id) {
        this.userService.getUserById(Number(this.id)).subscribe(
          response => {
            this.user = response;
            let formattedDate: any
            if (this.user.birthdate) {
              const [day, month, year] = this.user.birthdate?.split('/');
              formattedDate = `${year}-${month}-${day}`;
            }
            this.userForm.patchValue({
              email: this.user.email,
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              userName: this.user.userName,
              documentType: this.user.documentType,
              documentNumber: this.user.documentNumber,
              birthdate: formattedDate
            });


            if (this.user.addresses) {
              this.addresses = [...this.user.addresses];
            }

            if (this.user.contacts) {
              this.contacts = [...this.user.contacts];
            }
            console.log(this.user.roles)
            if (this.user.roles) {
              this.roles = [...this.user.roles];
            }
          },
          error => {
            this.toastService.sendError('Error al obtener el usuario')
          }
        );
      }
    }
    //#endregion

    //#region RUTEO | CANCELAR
    cancel() {
      this.router.navigate(["/users/user/list"])
    }
    //#endregion

    //#region FUNCION CONTACTO
    setContactValue(index: number) {
      const contact = this.contacts[index];
      if (contact) {
          const contactFormGroup = this.userForm.get('contactsForm') as FormGroup;

          contactFormGroup.patchValue({
            contactType: contact.contactType,
            contactValue: contact.contactValue
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
      if (this.userForm.controls['contactsForm'].controls['contactValue'].value
        && !this.userForm.controls['contactsForm'].controls['contactValue'].hasError('email')
        && this.userForm.controls['contactsForm'].controls['contactType'].value) {

        const contactValues = this.getContactsValues();
        if (this.contactIndex == undefined && contactValues) {
          this.contacts.push(contactValues);
        } else if (contactValues && this.contactIndex !== undefined) {
          this.contacts[this.contactIndex] = contactValues;
          this.contactIndex = undefined;
        }
        this.userForm.get('contactsForm')?.reset();
      } else {
        this.toastService.sendError("Contacto no válido")
      }
    }

    cancelEditContact() {
      this.userForm.get('contactsForm')?.reset();
      this.contactIndex = undefined;
    }

    removeContact(index: number): void {
      this.contacts.splice(index, 1);
    }


    changeContactType(event: any) {

      const type = event.target.value;
      if(type) {
        this.userForm.controls['contactsForm'].controls['contactValue'].addValidators(Validators.required);
        if(type === "EMAIL") {
          this.userForm.controls['contactsForm'].controls['contactValue'].addValidators(Validators.email)
        } else {
          this.userForm.controls['contactsForm'].controls['contactValue'].removeValidators(Validators.email)
        }
      }  else {
        this.userForm.controls['contactsForm'].controls['contactValue'].removeValidators(Validators.required)
      }
    }

    //#endregion

    //#region FUNCION ROLES

    checkVisibility() {
      this.isSuperAdmin = this.sessionService.hasRoleCodes(this.adminRoles);
    }

    getRolValue() {
      const rolFormGroup = this.userForm.get('rolesForm') as FormGroup;
      return {
        rol: rolFormGroup.get('rol')?.value || '',
      };
    }

    addRol(): void {
      if (this.userForm.get('rolesForm')?.valid) {
        const rolValue = this.getRolValue()
        console.log(rolValue.rol)
        rolValue && this.roles.push(rolValue.rol);
        console.log(this.roles)
        this.userForm.get('rolesForm')?.reset();
      } else {
        this.toastService.sendError("Rol no válido")
      }
    }

    removeRol(index: number): void {
      this.roles.splice(index, 1);
    }

    getAllRoles() {
      this.roleService.getAllRoles(0, 2147483647, true).subscribe(
        response => {
          if (!this.isSuperAdmin) {
            this.rolesForCombo = response.content.filter(role => role.name !== 'SUPERADMIN');
          } else {
            this.rolesForCombo = response.content;
          }
        }
      );
    }

    transformRoles(user: User): number[] | undefined {
      return user.roles?.map(role => role.code);
    }


    //#endregion

    //#region CREATE / UPDATE
    fillUser() {
      this.user.id = this.id ? parseInt(this.id) : undefined;
      (this.user.firstName = this.userForm.get('firstName')?.value || ''),
      (this.user.lastName = this.userForm.get('lastName')?.value || ''),
      (this.user.userName = this.userForm.get('userName')?.value || ''),
      (this.user.email = this.userForm.get('email')?.value || ''),
      (this.user.documentType = this.userForm.get('documentType')?.value || ''),
      (this.user.documentNumber = this.userForm.get('documentNumber')?.value || ''),
      (this.user.birthdate = this.userForm.get('birthdate')?.value || ''),
      (this.user.isActive = this.userForm.get('isActive')?.value || undefined),
      (this.user.contacts = [...this.contacts]),
      (this.user.addresses = [...this.addresses]);
      (this.user.roles = [...this.roles]),
      (this.user.plotId = this.plot ? this.plot.id : undefined)
    }

    createUser() {
      this.fillUser();
      this.user.isActive = true;
      this.user.roleCodeList = this.transformRoles(this.user)
      this.user = toSnakeCase(this.user);
      console.log(this.user)
      delete this.user.roles;
      this.userService.addUser(this.user).subscribe({
        // '1' is x-user-id
        next: (response) => {
          this.toastService.sendSuccess("Usuario creado con éxito")

          this.router.navigate(['/users/user/list']);
        },
        error: (error) => {
          console.error('Error creating owner:', error);
        },
      });
    }

    updateUser() {
      this.fillUser();
      if (this.user.id) {
        this.user.roles = this.transformRoles(this.user)
        delete this.user.createdDate
        console.log(this.user)
        console.log(this.user.documentType)
        console.log(this.user.documentNumber)
        this.userService.updateUser(this.user.id, toSnakeCase(this.user)).subscribe({
          next: (response) => {
            this.toastService.sendSuccess("Usuario actualizado con éxito")
            this.router.navigate(['users/user/list']);
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



    //#region FUNCION ADDRESS

  // Acceder directamente al valor del país en el FormControl
  get isArgentinaSelected(): boolean {
    return this.userForm.get('addressForm')?.get('country')?.value === 'ARGENTINA';
  }

  removeAddress(index: number): void {
    this.addresses.splice(index, 1);
  }

  getAddressValue(): Address {

    const address: Address = {
      streetAddress:
        this.userForm.get('addressForm.streetAddress')?.value || '',
      number: this.userForm.get('addressForm.number')?.value || 0,
      floor: this.userForm.get('addressForm.floor')?.value || 0,
      apartment: this.userForm.get('addressForm.apartment')?.value || '',
      city: this.userForm.get('addressForm.city')?.value || '',
      province: this.userForm.get('addressForm.province')?.value || '',
      country: this.userForm.get('addressForm.country')?.value || '',
      postalCode: this.userForm.get('addressForm.postalCode')?.value || 0
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

    console.log(this.userForm.get('addressForm'));


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
      this.toastService.sendError("Direccion no válida")
    }
  }

  cancelEditionAddress() {
    this.addressIndex = undefined;
    this.userForm.get('addressForm')?.reset();
  }
  //#endregion

  openInfo(){
    const modalRef = this.modalService.open(InfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true
    });

    modalRef.componentInstance.title = 'Registrar Usuario';
    modalRef.componentInstance.description = 'Pantalla para la gestión integral de usuarios, permitiendo la visualización, edición y administración de datos personales, información de contacto y detalles de dirección.';
    modalRef.componentInstance.body = [
      {
        title: 'Datos del Usuario',
        content: [
          {
            strong: 'Email:',
            detail: 'Campo para ingresar el correo electrónico del usuario.'
          },
          {
            strong: 'Nombre:',
            detail: 'Campo para ingresar el nombre del usuario.'
          },
          {
            strong: 'Nombre de usuario:',
            detail: 'Campo para ingresar el nombre de usuario.'
          },
          {
            strong: 'Apellido:',
            detail: 'Campo para ingresar el apellido del usuario.'
          }
        ]
      },
      {
        title: 'Añadir Roles',
        content: [
          {
            strong: 'Roles:',
            detail: 'Menú desplegable para seleccionar el rol del usuario.'
          },
          {
            strong: 'Agregar Rol:',
            detail: 'Botón con símbolo de "+" para agregar el rol seleccionado.'
          }
        ]
      },
      {
        title: 'Asociar un lote',
        content: [
          {
            strong: 'Número de Manzana:',
            detail: 'Campo de texto para ingresar el número de manzana.'
          },
          {
            strong: 'Número de Lote:',
            detail: 'Campo de texto para ingresar el número de lote.'
          }
        ]
      },
      {
        title: 'Añadir Dirección',
        content: [
          {
            strong: 'Calle:',
            detail: 'Campo para ingresar el nombre de la calle.'
          },
          {
            strong: 'Número:',
            detail: 'Campo para ingresar el número, con valor predeterminado 0.'
          },
          {
            strong: 'Piso:',
            detail: 'Campo para ingresar el piso, con valor predeterminado 0.'
          },
          {
            strong: 'Depto:',
            detail: 'Campo para ingresar el número de departamento.'
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
            detail: 'Campo para ingresar la ciudad.'
          },
          {
            strong: 'Código Postal:',
            detail: 'Campo para ingresar el código postal.'
          },
          {
            strong: 'Añadir Dirección:',
            detail: 'Botón para agregar la dirección ingresada.'
          }
        ]
      },
      {
        title: 'Añadir Contactos',
        content: [
          {
            strong: 'Tipo Contacto:',
            detail: 'Menú desplegable para seleccionar el tipo de contacto.'
          },
          {
            strong: 'Contacto:',
            detail: 'Campo para ingresar el contacto.'
          },
          {
            strong: 'Agregar Contacto:',
            detail: 'Botón con símbolo de "+" para agregar el contacto ingresado.'
          }
        ]
      }
    ];
    modalRef.componentInstance.notes = [
      'Campos obligatorios: Email, Nombre, Nombre de usuario, Apellido.'
    ];


  }
}
