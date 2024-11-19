import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Service, ServiceRequest } from "../../models/suppliers/service.model";
import { Observable } from "rxjs";
import { PORTSuppliers } from "../../utils/const";

@Injectable({
    providedIn: "root"
})
export class ServiceService {

    //private apiServiceUrl = 'http://localhost:8013/service';
    private apiServiceUrl = PORTSuppliers + 'service';

    constructor(private http: HttpClient) { }

    getServices(): Observable<Service[]> {
        return this.http.get<Service[]>(this.apiServiceUrl);
    }

    getServiceById(id: number): Observable<Service> {
        return this.http.get<Service>(`${this.apiServiceUrl}/${id}`);
    }

    createService(service: Service): Observable<Service> {
        const request: ServiceRequest = { name: service.name }
        return this.http.post<Service>(this.apiServiceUrl, request);
    }

    updateService(service: Service): Observable<Service> {
        return this.http.put<Service>(this.apiServiceUrl, service);
    }

    deleteService(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiServiceUrl}/${id}`);
    }
}