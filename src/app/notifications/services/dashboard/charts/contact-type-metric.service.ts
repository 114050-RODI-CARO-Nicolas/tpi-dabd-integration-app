import { Injectable } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContactModel } from '../../../models/contacts/contactModel';
import { ChartConfigurationService } from './chart-configuration.service';
import { ContactService } from '../../contact.service';

interface ContactTypeCounts {
  'Correo electrónico': number;
  'Teléfono': number;
  'Red social': number;
}

@Injectable({
  providedIn: 'root'
})
export class ContactTypeMetricService {

  private contactTypeData = new BehaviorSubject<ChartData<'pie'>>({
    labels: ['Email', 'Teléfono', 'Redes Sociales'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['rgba(255, 171, 145, 1)', 'rgba(144, 202, 249, 1)', 'rgba(188, 170, 164, 1)'],
      hoverBackgroundColor: ['rgba(255, 171, 145, 1)', 'rgba(144, 202, 249, 1)', 'rgba(188, 170, 164, 1)']
    }]
  });

  constructor(
    private chartConfigurationService: ChartConfigurationService,
    private contactService: ContactService
  ) {
    this.initializeData();
  }

  private initializeData(): void {
    this.contactService.getAllContacts().pipe(
      map(contacts => this.calculateContactTypeCounts(contacts))
    ).subscribe(counts => {
      this.updateChartData(counts);
    });
  }

  private calculateContactTypeCounts(contacts: ContactModel[]): ContactTypeCounts {
    const counts: ContactTypeCounts = {
      'Correo electrónico': 0,
      'Teléfono': 0,
      'Red social': 0
    };

    contacts
      .filter(contact => contact.active)
      .forEach(contact => {
        counts[contact.contactType as keyof ContactTypeCounts]++;
      });

    return counts;
  }

  private updateChartData(counts: ContactTypeCounts): void {
    const newData = {
      ...this.contactTypeData.value,
      datasets: [{
        ...this.contactTypeData.value.datasets[0],
        data: [
          counts['Correo electrónico'],
          counts['Teléfono'],
          counts['Red social']
        ]
      }]
    };
    this.contactTypeData.next(newData);
  }

  getContactTypeChartData(): Observable<ChartData<'pie'>> {
    return this.contactTypeData.asObservable();
  }

  getContactTypeChartOptions(): ChartOptions<'pie'> {
    return this.chartConfigurationService.getContactTypeChartOptions();
  }

  refreshData(): void {
    this.initializeData();
  }
}