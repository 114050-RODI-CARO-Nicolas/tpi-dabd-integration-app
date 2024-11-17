export interface TicketDetail {
  id: number;
  description: string;  // Cambiado de 'name'
  amount: number;       // Cambiado de 'price', eliminando 'quantity'
}

export enum TicketStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EXPIRED = 'EXPIRED',
  IN_DEFAULT = 'IN_DEFAULT',
}

export interface Owner{
  id: number,
  first_name: string,
  second_name: string,
  last_name: string
}

export interface TicketDto {
  id: number;                   // Cambiado de 'ticketNumber'
  ownerId: Owner;               // Cambiado de 'owner_id'
  issueDate: Date;               // Cambiado de 'emision_date'
  expirationDate: Date;          // Cambiado de 'expiration_date'
  status: TicketStatus;
  ticketNumber: string;
  lotId: number;
  ticketDetails: TicketDetail[]; // Cambiado de 'items'
  urlTicket: string;
  period: string
}


