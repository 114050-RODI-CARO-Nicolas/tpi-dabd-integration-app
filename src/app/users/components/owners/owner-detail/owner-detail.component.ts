import { Component, inject, OnInit } from '@angular/core';
import { Address, Contact, Owner, StateKYC } from '../../../models/owner';
import { OwnerService } from '../../../services/owner.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { mapOwnerType } from '../../../utils/owner-helper';
import { Country, Provinces } from '../../../models/generics';
import { MainContainerComponent } from 'ngx-dabd-grupo01';
import { InfoComponent } from '../../commons/info/info.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {Location, NgClass} from '@angular/common';

@Component({
  selector: 'app-owner-detail',
  standalone: true,
  imports: [ReactiveFormsModule, MainContainerComponent, NgClass],
  templateUrl: './owner-detail.component.html',
  styleUrl: './owner-detail.component.css'
})
export class OwnerDetailComponent implements OnInit {

  id: string | null = null;
  isDisabled = true;
  address!: Address;
  ownerTypes : string[] = ['PERSON', 'COMPANY', 'OTHER']
  contact!: Contact;
  owner!: Owner;
  addresses: Address[] = [];
  addressIndex: number | undefined = undefined;

  provinceOptions!: any;
  countryOptions!: any;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {}

  protected ownerService = inject(OwnerService);
  private modalService = inject(NgbModal)
  private location = inject(Location)

  ownerForm = new FormGroup({
    firstName: new FormControl({value:'', disabled: true}, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
    secondName: new FormControl({value:'', disabled: true}, [Validators.maxLength(50)]),
    lastName: new FormControl({value:'', disabled: true}, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
    ownerType: new FormControl({value:'', disabled: true}, [Validators.required]),
    documentNumber: new FormControl({value:'', disabled: true}, [Validators.required, Validators.pattern('^[0-9]*$')]),
    documentType: new FormControl({value:'', disabled: true}, [Validators.required]),
    cuit: new FormControl({value:'', disabled: true}, [Validators.required, Validators.pattern('^[0-9]*$')]),
    bankAccount: new FormControl({value:'', disabled: true}, [Validators.required, Validators.pattern('^[0-9]*$')]),
    birthdate: new FormControl({value:'', disabled: true}, [Validators.required]), // falta valdiar que sea pasada
    kycStatus: new FormControl({value:StateKYC.INITIATED, disabled: true}),
    isActive: new FormControl({value:true, disabled: true}),
    contactsForm: new FormArray([]),
    addressForm: new FormGroup({
      streetAddress: new FormControl({value:'', disabled: true}, [Validators.required]),
      number: new FormControl({value:0, disabled: true}, [Validators.required, Validators.min(0)]),
      floor: new FormControl({value:0, disabled: true}, ),
      apartment: new FormControl({value:'', disabled: true}, ),
      city: new FormControl({value:'', disabled: true}, [Validators.required]),
      province: new FormControl({value:'', disabled: true}, [Validators.required]),
      country: new FormControl({value:'', disabled: true}, [Validators.required]),
      postalCode: new FormControl({value:0, disabled: true}, [Validators.required]),
    })
  });


  contacts: Contact[] = [];
  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.setEnums();
    if(this.id) {
      this.ownerService.getOwnerById(parseInt(this.id, 10)).subscribe({
        next: (response: Owner) => {
          this.owner = response;
          this.addresses = response.addresses
          this.contacts = response.contacts as Contact[];
          this.fillFieldsToDetail(this.owner);
        },
        error: (error) => {
          console.error("Error al obtener propietarios:", error);
        }
      });
    }
  }

  createContactFormGroup(contactType: string = '', contactValue: string = ''): FormGroup {
    const contact = new FormGroup({
      contact_type: new FormControl({ value: contactType, disabled: true }, [Validators.required]),
      contact_value: new FormControl({ value: contactValue, disabled: true }, [Validators.required]),
    });
    return contact;
  }

  fillFieldsToDetail(owner: any): void {
    console.log('DETAIL->', owner);
    this.ownerForm.patchValue({
      firstName: owner.firstName,
      secondName: owner.secondName,
      lastName: owner.lastName,
      ownerType: owner.ownerType,
      documentNumber: owner.documentNumber,
      documentType: owner.documentType,
      cuit: owner.cuit,
      bankAccount: owner.bankAccount,
      birthdate: owner.birthdate,
      // kycStatus: owner.kycStatus,
      // isActive: owner.isActive,
    });
  }

  setContactsValues(contacts: Contact[]){
    const contactFormArray = this.ownerForm.get('contactsForm') as FormArray;
    contactFormArray.clear();
    contacts?.forEach((contact: Contact) => {
      const contactForm = this.createContactFormGroup(contact.contactType, contact.contactValue);
      contactFormArray?.push(contactForm);
    });
    this.contacts = contactFormArray.value;
  }

  setAddressValue(index: number) {
    const address = this.addresses[index];

    if (address) {
      const addressFormGroup = this.ownerForm.get('addressForm') as FormGroup;

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

  onBack(): void {
    this.location.back()
  }

  mapType(type: string){
    return mapOwnerType(type);
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

  openInfo(){
    const modalRef = this.modalService.open(InfoComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true
    });

    modalRef.componentInstance.title = 'Información del Propietario';
    modalRef.componentInstance.description = 'Pantalla para consultar la información del propietario detallando datos personales, dirección y contactos.';
    modalRef.componentInstance.body = [
      {
        title: 'Datos del Propietario',
        content: [
          {
            strong: 'Nombre:',
            detail: 'Nombre del propietario.'
          },
          {
            strong: 'Segundo nombre:',
            detail: 'Segundo nombre del propietario.'
          },
          {
            strong: 'Apellido:',
            detail: 'Apellido del propietario.'
          },
          {
            strong: 'Tipo propietario:',
            detail: 'Tipo de propietario.'
          },
          {
            strong: 'Tipo documento:',
            detail: 'Tipo de documento.'
          },
          {
            strong: 'Número:',
            detail: 'Número de documento.'
          },
          {
            strong: 'CUIT:',
            detail: 'CUIT del propietario.'
          },
          {
            strong: 'Cuenta bancaria:',
            detail: 'Cuenta bancaria del propietario.'
          },
          {
            strong: 'Fecha de nacimiento:',
            detail: 'Fecha de nacimiento en formato dd/mm/aaaa.'
          }
        ]
      },
      {
        title: 'Dirección del propietario',
        content: [
          {
            strong: 'Calle:',
            detail: 'Nombre de la calle.'
          },
          {
            strong: 'Número:',
            detail: 'Número de la propiedad'
          },
          {
            strong: 'Piso:',
            detail: 'Piso de la propiedad'
          },
          {
            strong: 'Depto:',
            detail: 'Departamento.'
          },
          {
            strong: 'País:',
            detail: 'País.'
          },
          {
            strong: 'Ciudad:',
            detail: 'Ciudad.'
          },
          {
            strong: 'Código postal:',
            detail: 'Código postal de la propiedad'
          }
        ]
      },
      {
        title: 'Contactos',
        content: [
          {
            strong: 'Contactos:',
            detail: 'Aquí se podrían listar los campos relacionados con los contactos.'
          }
        ]
      }
    ];
  }
}
