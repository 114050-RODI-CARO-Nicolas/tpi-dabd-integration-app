export interface Notification {
    id: number;
    recipient: string;
    contactId?: number;
    subject: string;
    templateId: number;
    templateName: string;
    statusSend: string;
    dateSend: string | Date;
    body: string;
    isRead?: boolean;
    dateNotification?: string | Date;
}

export interface NotificationModelChart {
  id: number;
  recipient: string;
  subject: string;
  templateId: number;
  templateName: string;
  dateSend: string;
  statusSend: string;
}

export interface NotificationKPIViewedModel {
  id: number;
  recipient: string;
  subject: string;
  templateId: number;
  templateName: string;
  dateSend: string;
  statusSend: 'SENT' | 'VISUALIZED';
}

