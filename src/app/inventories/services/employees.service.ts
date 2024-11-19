import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Employee, EmployeeFilter, EmployeePayment, EmployeeSchedule, StatusType } from '../models/employee.model';
import { MapperService } from './MapperCamelToSnake/mapper.service';
import { PaginatedResponse } from '../models/api-response';
import { environment } from '../../../environments/environment.prod';
import { PORTEmployees } from '../utils/const';


@Injectable({
  providedIn: 'root'
})
export class EmployeesService {

   //private apiUrl = 'http://localhost:8007/employees'; // URL de la API para empleados
   //private apiUrlSHIFT = 'http://localhost:8007/shift'; // URL de la API para empleados

    //private apiUrl = 'http://localhost:8080/employees/employees'; // URL de la API para compose
    //private apiUrlSHIFT = 'http://localhost:8080/employees/shift'; // URL de la API para compose
   
    //private apiUrl = environment.apis.employees + 'employees'; // URL de la API para compose
    //private apiUrlSHIFT = environment.apis.employees + 'shift'; // URL de la API para compose

    private apiUrl = PORTEmployees + 'employees'; // URL de la API para compose
    private apiUrlSHIFT = PORTEmployees + 'shift'; // URL de la API para compose
   
  private http = inject(HttpClient);
  private selectedEmployee = new BehaviorSubject<Employee | null>(null);
  private mapperService = inject(MapperService);

 


  //FILTROS DASHBOARD
  getFilteredEmployees(filters: any): Observable<Employee[]> {
    const params = new HttpParams({ fromObject: filters });
  
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map((employees) =>
        employees.map((employee) => ({
          ...employee,
          hiringDate: employee.hiring_date ? new Date(employee.hiring_date) : null // Convertimos a Date o dejamos null
        }))
      )
    );
  }
 
  //PARA LISTADO
  getAllEmployeesPaged(
    page: number = 0,
    size: number = 400,
    filters?: {
      firstName?: string;
      lastName?: string;
      type?: string;
      docType?: string;
      docNumber?: string;
      state?: string;
      startDate?: string;
      endDate?: string;
      salary?: string;
    }
  ): Observable<PaginatedResponse<Employee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
  
    if (filters) {
      if (filters.firstName) params = params.set('firstName', filters.firstName);
      if (filters.lastName) params = params.set('lastName', filters.lastName);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.docType) params = params.set('docType', filters.docType);
      if (filters.docNumber) params = params.set('docNumber', filters.docNumber);
      if (filters.state) params = params.set('state', filters.state);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.salary) params = params.set('salary', filters.salary);
    }
      console.log('Parámetros enviados al backend:', params.toString());
    return this.http.get<PaginatedResponse<Employee>>(`${this.apiUrl}/paged`, { params }).pipe(
      map(response => {
        // Mapeo los campos de snake_case a camelCase
        const mappedContent = response.content.map(employee => this.mapperService.toCamelCase(employee));
        return {
          ...response,
          content: mappedContent
        };
      }),
      tap(response => {
        response.content.forEach(employee => {
          if (!employee.hiringDate) {
            console.warn(`Employee with ID ${employee.id} is missing hiringDate.`);
          }
        });
      })
    );
  }
  //PARA FILTROS DE DASHBOARD
  getAllEmployeesDashboard(
    filters?: {
      startDate?: string;
      endDate?: string;
      state?:string;
    }
  ): Observable<Employee[]> {
    let params = new HttpParams();
  
    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.state) params = params.set('state', filters.state); // Agregamos el filtro de estado

    }
  
    console.log('Parámetros enviados al backend:', params.toString());
  
    return this.http.get<Employee[] | undefined>(`${this.apiUrl}/dashboards`, { params }).pipe(
      map(response => {
        if (!response) {
          console.warn('El backend devolvió una respuesta vacía o undefined');
          return []; // Devuelve una lista vacía si la respuesta es undefined
        }
        return response.map(employee => this.mapperService.toCamelCase(employee));
      }),
      tap(response => {
        response.forEach(employee => {
          if (!employee.hiringDate) {
            console.warn(`Employee with ID ${employee.id} is missing hiringDate.`);
          }
        });
      })
    );
  }
  
  
  
  
  
  //fin filtros dashboard
  createSchedule(schedule: EmployeeSchedule): Observable<EmployeeSchedule> {
    console.log('Schedule to create:', schedule);
    return this.http.post<EmployeeSchedule>(this.apiUrlSHIFT, schedule);
  }

  getEmployeeSchedules(employeeId: number): Observable<EmployeeSchedule[]> {
    return this.http.get<EmployeeSchedule[]>(`${this.apiUrlSHIFT}/employee/${employeeId}`);
  }
  
  updateSchedule(schedule: EmployeeSchedule): Observable<EmployeeSchedule> {
    return this.http.put<EmployeeSchedule>(`${this.apiUrlSHIFT}/${schedule.employee_id}`, schedule);
  }
  
  getEmployeesPageable(
    page: number = 0,
    size: number = 10,
    type?: StatusType
  ): Observable<PageResponse<Employee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
  
    if (type) {
      params = params.set('type', type);
    }
    
    return this.http.get<PageResponse<Employee>>(`${this.apiUrl}/pageable`, { params }).pipe(
      tap(response => {
        // Verificar en la consola si todos los empleados tienen `hiringDate`
        response.content.forEach(employee => {
          if (!employee.hiringDate) {
            console.warn(`Employee with ID ${employee.id} is missing hiringDate`);
          }
        });
      })
    );
  }
  
  // getEmployeesPageable(
  //   page: number = 0,
  //   size: number = 10,
  //   type?: StatusType
  // ): Observable<PageResponse<Employee>> {
  //   let params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('size', size.toString());
    
  //   if (type) {
  //     params = params.set('type', type);
  //   }
  //   return this.http.get<PageResponse<Employee>>(`${this.apiUrl}/pageable`, { params });
  // }

  // Obtener empleados
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }
  
  setSelectedEmployee(employee: Employee) {
    this.selectedEmployee.next(employee);
  }
  getSelectedEmployee(): Observable<Employee | null> {
    return this.selectedEmployee.asObservable();
  }

  getEmployeeById(id: number): Observable<Employee> {
    console.log("Este es el id:", id);
   // debugger
    return this.http.get<Employee>(`${this.apiUrl}/${id}`).pipe(
      map(employee => this.mapperService.toCamelCase(employee))
    );
    
  }

  // Agregar un nuevo empleado
  addEmployee(employee: Employee): Observable<Employee> {
    // Assuming employee.hiringDate is a Date object
    console.log('Servicio',employee);
    //employee.hiringDate.setHours(employee.hiringDate.getHours() + 5);
    return this.http.post<Employee>(this.apiUrl, employee);
  }

  // Actualizar un empleado existente
  updateEmployee(employee: Employee): Observable<Employee> {
    //employee.hiringDate.setHours(employee.hiringDate.getHours() + 5);
    return this.http.put<Employee>(`${this.apiUrl}/update/${employee.id}`, employee);
  }

  // Eliminar (o desactivar) un empleado
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Obtener pagos de un empleado
  getEmployeePayments(employeeId: number): Observable<EmployeePayment[]> {
    return this.http.get<EmployeePayment[]>(`${this.apiUrl}/${employeeId}/payments`);
  }

  getEmployee(id:number):Observable<Employee>{
    return this.http.get<Employee>(this.apiUrl+"/"+id);
  }
  checkIfDocumentExists(docNumber: string): Observable<boolean> {
    const filter: { docNumber: string } = { docNumber }; // Crear el filtro necesario
    return this.http.post<Employee[]>(`${this.apiUrl}/search`, filter).pipe(
      map(employees => employees.length > 0) // Verificar si hay empleados
    );
  }

  searchEmployees(filter: EmployeeFilter): Observable<Employee[]> {
    const snakeCaseFilter = this.mapperService.toSnakeCase(filter);
    return this.http.post<any[]>(`${this.apiUrl}/search`, snakeCaseFilter).pipe(
      map(employees => this.mapperService.toCamelCase(employees))
    );
  }
  // searchEmployees(filters: any): Observable<Employee[]> {
  //   // Asegúrate de que el endpoint y el método de envío sean correctos
  //   return this.http.post<Employee[]>(`${this.apiUrl}/search`, filters);
  // }
  


  // getAllEmployeesPaged(
  //   page: number = 0,
  //   size: number = 40,
  //   filters?: {
  //     firstName?: string;
  //     lastName?: string;
  //     type?: string;
  //     docType?: string;
  //     docNumber?: string;
  //     state?: string;
  //     date?: string;
  //     salary?: string;
  //   }
    
  // ): Observable<PaginatedResponse<Employee>> {
  //   let params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('size', size.toString());
  
  //   if (filters) {
  //     if (filters.firstName) params = params.set('firstName', filters.firstName);
  //     if (filters.lastName) params = params.set('lastName', filters.lastName);
  //     if (filters.type) params = params.set('type', filters.type);
  //     if (filters.docType) params = params.set('docType', filters.docType);
  //     if (filters.docNumber) params = params.set('docNumber', filters.docNumber);
  //     if (filters.state) params = params.set('state', filters.state);
  //     if (filters.date) params = params.set('date', filters.date);
  //     if (filters.salary) params = params.set('salary', filters.salary);
  //   }
  //   console.log(filters);
  //   console.log('filtros de tipo', filters?.type);
  //   debugger
  //   console.log('params', params);
  //   return this.http.get<PaginatedResponse<Employee>>(`${this.apiUrl}/paged`, { params });
  // }

 /* getAllEmployeesPaged(filters: {
    page?: number;
    size?: number;
    firstName?: string;
    lastName?: string;
    type?: string;
    docType?: string;
    docNumber?: string;
    state?: string;
    date?: string;
    salary?: string;
  }): Observable<PaginatedResponse<Employee>> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params = params.append(key, value.toString());
      }
    });
    return this.http.get<PaginatedResponse<Employee>>(`${this.apiUrl}/paged`, { params })//;
    .pipe(
      tap((response) => {
        console.log('Respuesta de la API:', response);
        console.log('Contenido de la primera página:', response.content);
        if (response.content.length > 0) {
          console.log('Primer empleado:', response.content[0]);
          console.log('Fecha de contratación del primer empleado:', response.content[0].hiringDate);
        }
      })
    );
  } */ 
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
