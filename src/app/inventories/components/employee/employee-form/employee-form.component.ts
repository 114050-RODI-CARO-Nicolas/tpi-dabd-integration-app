import { Component, inject, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { EmployeeType, Employee, DocumentType, StatusType } from '../../../models/employee.model';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeesService } from '../../../services/employees.service';
import { debounceTime, map, switchMap } from 'rxjs';
import { MapperService } from '../../../services/MapperCamelToSnake/mapper.service';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { EmployeeAccessComponent } from "../employee-access/employee-access.component";
import { EmployeeContactComponent } from "../employee-contact/employee-contact.component";
import { Contact } from '../../../models/contact.model';
import { Provinces } from '../../../models/enums/provinces.enum';
import { Countries } from '../../../models/enums/countries.enum';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, EmployeeAccessComponent, EmployeeContactComponent, MainContainerComponent],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss'],
})
export class EmployeeFormComponent implements OnInit {

  today = new Date().toISOString();
  formattedToday = this.today.split('T')[0];
  formattedDateTime = this.today.slice(0, 19);

  employeeForm = new FormGroup({
    //id: new FormControl(0),
    firstName: new FormControl('', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(100),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
    ]),
    lastName: new FormControl('', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(100),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
    ]),
    employeeType: new FormControl(EmployeeType.ADMINISTRATIVO, Validators.required),
    hiringDate: new FormControl<string>(this.formattedDateTime, {
      validators: [
        Validators.required,
        (control) => {
          const date = new Date(control.value);
          const today = new Date();
          return date > today ? { futureDate: true } : null;
        }
      ],
      nonNullable: true,
    }),
    documentType: new FormControl(DocumentType.DNI, Validators.required),
    docNumber: new FormControl('', [
      Validators.required, 
      this.documentValidator()
    ]),
    salary: new FormControl(0, [
      Validators.required, 
      Validators.min(0),
      Validators.pattern(/^\d+(\.\d{1,2})?$/)
    ]),
    state: new FormControl(StatusType.ACTIVE),
    contactsForm: new FormGroup({
      contactType: new FormControl('EMAIL', []),
      contactValue: new FormControl('', [
        Validators.required,
        (control) => {
          const type = control.parent?.get('contactType')?.value;
          if (!type || !control.value) return null;

          switch (type) {
            case 'EMAIL':
              return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(control.value) 
                ? null 
                : { invalidEmail: true };
            default:
              return null;
          }
        }
      ])
    }),
    address: new FormGroup({
      streetAddress: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]),
      number: new FormControl(0, [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d+$/)
      ]),
      floor: new FormControl(0, [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d+$/)
      ]),
      apartment: new FormControl(''),
      city: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      ]),
      province: new FormControl('', [Validators.required]),
      country: new FormControl({value:'', disabled: true}),
      postalCode: new FormControl(0, [
        Validators.required, 
        Validators.min(0),
        Validators.pattern(/^\d+$/)
      ])
    })
  });
  // employeeForm = new FormGroup({
  //   id:new FormControl(0),
  //   firstName: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
  //   lastName: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
  //   employeeType: new FormControl(EmployeeType.ADMINISTRATIVO, Validators.required),
  //   hiringDate: new FormControl<string>(this.formattedDateTime, {
  //     validators: [Validators.required],
  //     nonNullable: true,
  //   }),
  //   documentType: new FormControl(DocumentType.DNI, Validators.required),
  //   docNumber: new FormControl('', [Validators.required, Validators.pattern(/^[0-9.-]*$/)]),
  //   salary: new FormControl(0, [Validators.required, Validators.min(0)]),
  //   state: new FormControl(StatusType.ACTIVE),
  //   contactsForm: new FormGroup({
  //     contactType: new FormControl('', []),
  //     contactValue: new FormControl('', []),
  //   }),
  //   address: new FormGroup({
  //     street_address: new FormControl('', [Validators.required]),
  //     number: new FormControl(0, [Validators.required, Validators.min(0)]),
  //     floor: new FormControl(0, [Validators.required, Validators.min(0)]),
  //     apartment: new FormControl(''),
  //     city: new FormControl('', [Validators.required]),
  //     province: new FormControl('', [Validators.required]),
  //     country: new FormControl('', [Validators.required]),
  //     postal_code: new FormControl(0, [Validators.required, Validators.min(0)])
  //   })
  // });

  @ViewChild('accessModal') accessModal!: TemplateRef<any>;
  contactTypes = ['PHONE', 'EMAIL', 'SOCIAL_MEDIA_LINK'];
  private toastService = inject(ToastService);
  
  // get contacts() {
  //   return this.employeeForm.get('contacts') as FormArray;
  // }

  // addContact() {
  //   const contactForm = new FormGroup({
  //     contact_type: new FormControl('', Validators.required),
  //     contact_value: new FormControl('', [Validators.required])
  //   });
  //   this.contacts.push(contactForm);
  // }

  // removeContact(index: number) {
  //   this.contacts.removeAt(index);
  // }
  
 currentEmployeeId!: number;

  constructor() {}

  @ViewChild('infoModal') infoModal!: TemplateRef<any>;

  private readonly employeeService = inject(EmployeesService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mapperService = inject(MapperService);

  private modalService = inject(NgbModal);
  employeeTypes= Object.values(EmployeeType);
  documentTypes= Object.values(DocumentType);
  private currentId = 0;
  isEdit:boolean=false;

  id: string | null = null;
  showEmployeeForm = true;
  employeeRegistered = false;
  contactIndex:number | undefined = undefined;
  contacts: Contact[] = [];
  provinceOptions!: any;
  countryOptions!: any;
  
  formHasChanges: boolean = false;
  initialFormValue: any;

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      const id = +params['id'];
      console.log(id);
      if (id) {
        this.getById(id);
      } else {
        this.employeeForm.patchValue({
          address:{
            city: 'Córdoba',
            province: Provinces.CORDOBA,
            country: Countries.ARGENTINA,
            postalCode: 5000
          }
        })
      }
    });
    this.employeeForm.valueChanges.subscribe(() => {
      if (this.isEdit && this.initialFormValue) {
        this.checkFormChanges();
      }
    });

    this.addContact();

    this.employeeForm.get('hiringDate')?.valueChanges.subscribe(value => {
      this.employeeForm.patchValue({ hiringDate: value });
    })

    this.loadCountries();
    this.loadProvinces();
  }

  loadCountries() {
    this.countryOptions = Object.keys(Countries).map(key => ({
      value: Countries[key as keyof typeof Countries],
      display: Countries[key as keyof typeof Countries]
    }));
  }
  
  loadProvinces() {
    this.provinceOptions = Object.keys(Provinces).map(key => ({
      value: Provinces[key as keyof typeof Provinces],
      display: Provinces[key as keyof typeof Provinces]
    }));
  }

  getById(id: number) {
    this.currentId = id;
    this.employeeService.getEmployeeById(id).subscribe((data) => {
      data = this.mapperService.toCamelCase(data);
      console.log('[EmployeeForm] Datos originales:', data);
      
      this.employeeForm.patchValue({
        //id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        employeeType: data.employeeType,
        hiringDate: new Date(data.hiringDate).toISOString().split('T')[0],
        documentType: data.documentType,
        docNumber: data.docNumber,
        state: StatusType.ACTIVE,
        salary: data.salary,
        address: data.address,
        contactsForm: data.contact,
      });

      // Guardar el estado inicial del formulario después de cargarlo
      this.initialFormValue = this.employeeForm.value;
      this.formHasChanges = false;
      this.isEdit = true;
      
      console.log('[EmployeeForm] Valor inicial del formulario guardado:', this.initialFormValue);
    });
  }

  saveEmployee() {
    if (this.employeeForm.valid) {
      let employeeData = this.prepareEmployeeData();
      employeeData = this.mapperService.toSnakeCase(employeeData);
      console.log(employeeData);
      if (this.currentId!=0) {
        employeeData.id=this.currentId;
        this.updateEmployee(employeeData);
      } else {
        employeeData.id
        this.createEmployee(employeeData);
        //this.router.navigate(['/inventories/employees/list']); // Redirect to employee list       
      }
    }
  }
  resetForm(): void {
    this.showEmployeeForm = true;
    this.employeeRegistered = false;
    this.employeeForm.reset({
      //id: 0,
      firstName: '',
      lastName: '',
      employeeType: EmployeeType.MANTENIMIENTO,
      hiringDate: new Date().toISOString().split('T')[0],
      documentType: DocumentType.DNI,
      docNumber: '',
      state: StatusType.ACTIVE,
      salary: 0,
      address: {
        streetAddress: '',
        number: 0,
        floor: 0,
        apartment: '',
        city: 'Córdoba',
        province: Provinces.CORDOBA,
        country: Countries.ARGENTINA,
        postalCode: 5000  
      }
    });
    // this.contacts.clear();
    // this.addContact();
  }
/*
  prepareEmployeeData(): Employee {
    const { id, firstName, lastName, employeeType, hiringDate, documentType, docNumber, salary, state } = this.employeeForm.value;    
    let parsedHiringDate: Date | null = new Date();
    /*if (hiringDate) {
      parsedHiringDate = new Date(hiringDate);
    }

    return {
      id,
      firstName,
      lastName,
      employeeType,
      documentType: documentType,
      docNumber,
      hiringDate,
      salary,
      state,
    } as Employee;
  } */
    prepareEmployeeData(): any {
      const formValue = this.employeeForm.getRawValue();
      const hiringDate = formValue.hiringDate 
      ? new Date(formValue.hiringDate).toISOString()
      : new Date().toISOString();
      //const hiringDate = formValue.hiringDate + (formValue.hiringDate?.includes('T') ? '' : 'T00:00:00');
      // Crear el objeto base del empleado
      const employeeData = {
        //id: formValue.id,
        first_name: formValue.firstName,
        last_name: formValue.lastName,
        employee_type: formValue.employeeType,
        document_type: formValue.documentType,
        doc_number: formValue.docNumber,
        hiring_date: hiringDate,
        salary: formValue.salary,
        state: formValue.state,
        // contact: this.contacts.length > 0 ? this.contacts.at(0).value : null,
        address: formValue.address,
        contact: formValue.contactsForm
      };
  
      return employeeData;
    }

  showInfo(): void {
    this.modalService.open(this.infoModal, { centered: true });
  }

  createEmployee(employee: Employee) {
    console.log(employee);
    console.log("Este es el metodo de createEmployee");
    this.employeeService.addEmployee(employee).subscribe({
      next: (response) => {
        this.toastService.sendSuccess("El Empleado ha sido creado con éxito.");
        if( response.id){
          this.currentEmployeeId = response.id;
          this.employeeRegistered = true;
          this.disableForm();
          console.log('id enviado', this.currentEmployeeId);
          this.openAccessModal();
        }
        this.toastService.sendSuccess("Cargue los dato de acceso.");
        this.resetForm(); // Limpia el formulario
      },
      error: (error) => {
        this.toastService.sendError("Hubo un error en la creación del empleado.");
      } 
    });
  }

  setEnums(){
    this.provinceOptions = Object.entries(Provinces).map(([key, value]) => ({
      value: key,
      display: value
    }));
    this.countryOptions = Object.entries(Countries).map(([key, value]) => ({
      value: key,
      display: value
    }));
  }

  disableForm(): void {
    Object.keys(this.employeeForm.controls).forEach(key => {
      this.employeeForm.get(key)?.disable();
      // this.contacts.get('contact_type')?.disable();
    });
  }

  startNewEmployee(): void {
    this.resetForm();
    this.employeeForm.enable();
    this.currentEmployeeId = 0;
  }

  updateEmployee(employee: Employee) {
    console.log('[EmployeeForm] Actualizando empleado:', employee);
    this.employeeService.updateEmployee(employee).subscribe({
      next: (response) => {
        this.toastService.sendSuccess("El Empleado ha sido modificado con éxito.");
        this.formHasChanges = false;
        this.initialFormValue = this.employeeForm.value;
        this.router.navigate(['/inventories/employees/list']);
      },
      error: (error) => {
        this.toastService.sendError("Hubo un error en la modificación del empleado.");
        console.error('[EmployeeForm] Error al actualizar:', error);
      }
    });
  }


  return() {
    this.router.navigate(['/inventories/employees/list']);
  }

  documentExistsValidator(control: AbstractControl) {
    return control.valueChanges.pipe(
      debounceTime(300), // para evitar múltiples llamadas al backend
      switchMap((documentNumber) => 
        this.employeeService.checkIfDocumentExists(documentNumber)
        
      ),
      map((exists: boolean) => (exists ? { documentExists: true } : null))
      
    );
    
}

onCancel(){
  this.resetForm();
  this.router.navigate(['/inventories/employees/list']);
}
openAccessModal() {
  const modalRef = this.modalService.open(this.accessModal, {
    size: 'lg',
    backdrop: 'static',
    keyboard: false
  });
}

onAccessSaved() {
  this.modalService.dismissAll();
  this.startNewEmployee();
  this.router.navigate(['/inventories/employees/list']);
}

  changeContactType(event: any) {
      
    const type = event.target.value;
    if(type) {
      this.employeeForm.controls['contactsForm'].controls['contactValue'].addValidators(Validators.required);
      if(type === "EMAIL") {
        this.employeeForm.controls['contactsForm'].controls['contactValue'].addValidators(Validators.email)
      } else {
        this.employeeForm.controls['contactsForm'].controls['contactValue'].removeValidators(Validators.email)
      }
    }  else {
      this.employeeForm.controls['contactsForm'].controls['contactValue'].removeValidators(Validators.required)
    }
  }

  addContact(): void {
    if (this.employeeForm.controls['contactsForm'].controls['contactValue'].value
      && !this.employeeForm.controls['contactsForm'].controls['contactValue'].hasError('email')
      && this.employeeForm.controls['contactsForm'].controls['contactType'].value) {

      const contactValues = this.getContactsValues();
      if (this.contactIndex == undefined && contactValues) {
        this.contacts.push(contactValues);
      } else if (contactValues && this.contactIndex !== undefined) {
        this.contacts[this.contactIndex] = contactValues;
        this.contactIndex = undefined;
      }
      this.employeeForm.get('contactsForm')?.reset();
    } else {
      //this.toastService.sendError("Contacto no valido.")
    }
  }

  getContactsValues(): Contact {
    const contactFormGroup = this.employeeForm.get('contactsForm') as FormGroup;
    return {
      contactType: contactFormGroup.get('contactType')?.value || '',
      contactValue: contactFormGroup.get('contactValue')?.value || '',
    };
  }

  cancelEditContact() {
    this.employeeForm.get('contactsForm')?.reset();
    this.contactIndex = undefined;
  }

  setContactValue(index: number) {
    const contact = this.contacts[index];
    if (contact) {
        const contactFormGroup = this.employeeForm.get('contactsForm') as FormGroup;

        contactFormGroup.patchValue({
          contactType: contact.contactType,
          contactValue: contact.contactValue
        })

        this.contactIndex = index;
    }
  }

  removeContact(index: number): void {
    this.contacts.splice(index, 1);
  }

  private checkFormChanges(): void {
    if (!this.initialFormValue) {
      console.warn('[EmployeeForm] No hay valor inicial para comparar');
      return;
    }

    const currentValue = this.employeeForm.value;
    this.formHasChanges = !this.isEqual(currentValue, this.initialFormValue);
    console.log('[EmployeeForm] Formulario tiene cambios:', this.formHasChanges);
  }

  private isEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(this.cleanObject(obj1)) === JSON.stringify(this.cleanObject(obj2));
  }

  private cleanObject(obj: any): any {
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
        delete cleaned[key];
      } else if (typeof cleaned[key] === 'object') {
        cleaned[key] = this.cleanObject(cleaned[key]);
      }
    });
    return cleaned;
  }

    private dniValidator(): ValidatorFn {
      return (control: AbstractControl) => {
        if (!control.value) return null;
        const dni = control.value.toString().replace(/\D/g, '');
        if (dni.length > 8) {
          return { invalidDni: 'El DNI no puede tener más de 8 dígitos' };
        }
        return null;
      };
    }

    private cuitValidator(): ValidatorFn {
      return (control: AbstractControl) => {
        if (!control.value) return null;
        
        // Eliminar caracteres no numéricos y convertir a string
        const number = control.value.toString().replace(/\D/g, '');
        
        // Validar longitud
        if (number.length !== 11) {
          return { invalidLength: 'CUIT/CUIL debe tener 11 dígitos' };
        }
    
        // Convertir a array de números
        const numberArray = number.split('').map(Number);
        
        // Obtener dígito verificador (último número)
        const verificador = numberArray[10];
    
        // Multiplicadores para el cálculo
        const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        
        // Calcular suma de productos
        let suma = 0;
        for (let i = 0; i < multiplicadores.length; i++) {
          suma += numberArray[i] * multiplicadores[i];
        }
    
        // Calcular dígito verificador esperado
        let digitoEsperado = 11 - (suma % 11);
        
        // Manejar casos especiales
        if (digitoEsperado === 11) {
          digitoEsperado = 0;
        } else if (digitoEsperado === 10) {
          return { 
            invalidCheckDigit: 'CUIT/CUIL inválido - Verificador no puede ser 10' 
          };
        }
    
        // Comparar dígito calculado con el verificador
        if (verificador !== digitoEsperado) {
          return { 
            invalidCheckDigit: 'Dígito verificador inválido',
            expected: digitoEsperado,
            received: verificador
          };
        }
    
        // Validar el tipo según si es CUIT o CUIL
        const tipo = parseInt(number.substring(0, 2));
        const tiposValidosCUIT = [30, 33, 34];
        const tiposValidosCUIL = [20, 23, 24, 27];
        
        const docType = control.parent?.get('documentType')?.value;
        
        if (docType === DocumentType.CUIT && !tiposValidosCUIT.includes(tipo)) {
          return { invalidType: 'Tipo de CUIT inválido' };
        }
        
        if (docType === DocumentType.CUIL && !tiposValidosCUIL.includes(tipo)) {
          return { invalidType: 'Tipo de CUIL inválido' };
        }
    
        return null;
      };
    }
    private documentValidator(): ValidatorFn {
      return (control: AbstractControl) => {
        if (!control.value) return null;
        
        const docType = control.parent?.get('documentType')?.value;
        switch (docType) {
          case DocumentType.DNI:
            return this.dniValidator()(control);
          case DocumentType.CUIT:
          case DocumentType.CUIL:
            return this.cuitValidator()(control);
          default:
            return null;
        }
      };
    }
    getErrorMessage(controlName: string, groupName?: string): string {
      const control = groupName ? 
        this.employeeForm.get(`${groupName}.${controlName}`) : 
        this.employeeForm.get(controlName);
  
      if (control?.errors) {
        if (control.errors['required']) return 'Este campo es requerido';
        if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
        if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
        if (control.errors['pattern']) return 'Formato inválido';
        if (control.errors['min']) return 'El valor debe ser mayor a 0';
        if (control.errors['invalidDni']) return 'DNI inválido';
        if (control.errors['invalidLength']) return 'CUIT/CUIL debe tener 11 dígitos';
        if (control.errors['invalidCheckDigit']) return 'CUIT/CUIL inválido';
        if (control.errors['invalidEmail']) return 'Email inválido';
        if (control.errors['invalidPhone']) return 'Teléfono inválido';
        if (control.errors['invalidUrl']) return 'URL inválida';
        if (control.errors['futureDate']) return 'La fecha no puede ser futura';
      }
      return '';
    }

  
}