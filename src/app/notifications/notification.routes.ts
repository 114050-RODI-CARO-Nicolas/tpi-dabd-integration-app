import { Routes } from '@angular/router';
import { NotificationHomeComponent } from './notification-home/notification-home.component';
import { NotificationHistoricComponent } from './modules/components/notification-historic/notification-historic.component';
import { ContactAuditHistoryComponent } from './modules/components/contact-audit-history/contact-audit-history.component';
import { ContactListComponent } from './modules/components/contact-list/contact-list.component';
import { ContactNewComponent } from './modules/components/contact-new/contact-new.component';
import { SendEmailContactComponent } from './modules/components/send-email-contact/send-email-contact.component';
import { SendEmailComponent } from './modules/components/send-email/send-email.component';
import { TemplateEmailComponent } from './modules/components/template-email/template-email.component';
import { TemplateListComponent } from './modules/components/template-list/template-list.component';
import { MyNotificationComponent } from './modules/components/my-notification/my-notification.component';
import { NotificationChartComponent } from './modules/components/notification-chart/notification-chart.component';
import { authGuard } from '../users/guards/auth.guard';
import { URLTargetType } from '../users/models/role';
import { hasRoleCodeGuard } from '../users/guards/has-role-code.guard';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: 'templates/new',
    component: TemplateEmailComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'templates',
    component: TemplateListComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'send-email',

    component: SendEmailComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'send-email-contact',
    component: SendEmailContactComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'notifications-historic',
    component: NotificationHistoricComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'my-notification',
    component: MyNotificationComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
        URLTargetType.OWNER,
        URLTargetType.TENANT,
      ],
    },
  },
  {
    path: 'contact-audit',
    component: ContactAuditHistoryComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'contacts',
    component: ContactListComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'contact/new',
    component: ContactNewComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
  {
    path: 'notification/charts',
    component: NotificationChartComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [
        URLTargetType.SUPERADMIN,
        URLTargetType.USER_ADMIN,
        URLTargetType.NOTIFICATIONS_ADMIN,
      ],
    },
  },
];
