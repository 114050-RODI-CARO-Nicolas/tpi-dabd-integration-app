import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ContactService } from '../../contact.service';

interface Contact {
  id: number;
  subscriptions: string[];
  contact_value: string;
  contact_type: string;
  active: boolean;
}

interface DateFilter {
  dateFrom: string | null;
  dateUntil: string | null;
}

interface RetentionStats {
  averageRetention: number;
  totalOptionalSubscriptions: number;
  activeOptionalSubscriptions: number;
}

@Injectable({
  providedIn: 'root'
})
export class KpiAverageRetentionService {
  private contactService = inject(ContactService);

  private readonly OPTIONAL_SUBSCRIPTIONS = [
    'General',
    'Pago de Empleados',
    'Vencimiento de Gastos',
    'Factura General',
    'Pago',
    'Usuario Asociado Creado',
    'Salida Tardía de Trabajador',
    'Inventario',
    'Gasto General'
  ];

  private currentFilter$ = new BehaviorSubject<DateFilter>({
    dateFrom: null,
    dateUntil: null
  });

  private retentionStats$ = new BehaviorSubject<RetentionStats>({
    averageRetention: 0,
    totalOptionalSubscriptions: 0,
    activeOptionalSubscriptions: 0
  });

  getRetentionStats(): Observable<RetentionStats> {
    return this.retentionStats$.asObservable();
  }

  loadData(): void {
    this.contactService.getAllContacts()
      .subscribe({
        next: (contacts) => {
          this.updateStats(contacts);
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
          this.resetStats();
        }
      });
  }

  updateDateFilter(filter: DateFilter): void {
    this.currentFilter$.next(filter);
    this.loadData(); // Recargar datos cuando cambie el filtro
  }


  private updateStats(contacts: any[]): void {

    const activeContacts = contacts.filter(contact => contact.active);
    const totalContacts = activeContacts.length;

    if (totalContacts === 0) {
      this.resetStats();
      return;
    }

    const retentionRates = this.OPTIONAL_SUBSCRIPTIONS.map(subscription => {
      const subscribedCount = activeContacts.filter(contact =>
        contact.subscriptions.includes(subscription)
      ).length;

      return (subscribedCount / totalContacts) * 100;
    });

    // Calcular promedio de retención
    const averageRetention = retentionRates.reduce((acc, rate) => acc + rate, 0) /
      this.OPTIONAL_SUBSCRIPTIONS.length;

    const totalPossibleSubscriptions = totalContacts * this.OPTIONAL_SUBSCRIPTIONS.length;
    const activeSubscriptions = activeContacts.reduce((acc: number, contact: Contact) =>
      acc + contact.subscriptions.filter((sub: string) =>
        this.OPTIONAL_SUBSCRIPTIONS.includes(sub as typeof this.OPTIONAL_SUBSCRIPTIONS[number])
      ).length, 0);

    this.retentionStats$.next({
      averageRetention,
      totalOptionalSubscriptions: totalPossibleSubscriptions,
      activeOptionalSubscriptions: activeSubscriptions
    });
  }

  private resetStats(): void {
    this.retentionStats$.next({
      averageRetention: 0,
      totalOptionalSubscriptions: 0,
      activeOptionalSubscriptions: 0
    });
  }
}
