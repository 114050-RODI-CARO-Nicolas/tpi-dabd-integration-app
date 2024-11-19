import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  constructor() { }

  private httpMethods = inject(HttpClient)

  getDays():Observable<number> {
    return this.httpMethods.get<number>(environment.apis.moderations+"infraction-config/appeal-days")
  }

  putDays(days:number, id:number):Observable<number> {

    const header = new HttpHeaders({
      'userId': id.toString(),
      'Content-Type': 'application/json'});

    return this.httpMethods.put<number>(environment.apis.moderations+`infraction-config/appeal-days?daysToAppeal=${days}`,
      null,
      {headers: header});
  }
}
