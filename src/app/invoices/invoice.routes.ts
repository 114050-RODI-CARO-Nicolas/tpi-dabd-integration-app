import { Routes } from "@angular/router";
import { InvoiceHomeComponent } from "./invoice-home/invoice-home.component";
import { AdminListExpensasComponent } from "./admin-list-expensas/admin-list-expensas.component";
import { OwnerListExpensasComponent } from "./owner-list-expensas/owner-list-expensas.component";
import { ReviewTicketsTransferComponent } from "./review-tickets-transfer/review-tickets-transfer.component";
import { StadisticsComponent } from "./dashboard/stadistics/stadistics.component";
import { authGuard } from "../users/guards/auth.guard";
import { hasRoleCodeGuard } from "../users/guards/has-role-code.guard";
import { URLTargetType } from "../users/models/role";


const stadisticsAdmin : Number[] = [URLTargetType.SUPERADMIN , URLTargetType.FINANCE,
    URLTargetType.FINANCE_ASSISTANT, URLTargetType.PAYMENTS_ADMIN];


export const INVOICE_ROUTES: Routes = [
    { path: '', component: InvoiceHomeComponent },
    {
        path: 'admin-list-expensas',
        component: AdminListExpensasComponent,
        canActivate: [authGuard],
        canMatch: [hasRoleCodeGuard],
        data: { allowedRoleCodes: [
            URLTargetType.SUPERADMIN , URLTargetType.ADMINISTRATIVE, 
            URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT, URLTargetType.PAYMENTS_ADMIN
        ] }
    },
    {
        path: 'owner-list-expensas',
        component: OwnerListExpensasComponent,
        canActivate: [authGuard],
        canMatch: [hasRoleCodeGuard],
        data: { allowedRoleCodes: [URLTargetType.OWNER, URLTargetType.TENANT] }
    },
    {
        path: 'stadistics',
        component: StadisticsComponent,
        canActivate: [authGuard],
        canMatch: [hasRoleCodeGuard],
        data: { allowedRoleCodes: stadisticsAdmin}
    },
    {
        path: 'stadistics/:id',
        component: StadisticsComponent,
        canActivate: [authGuard],
        canMatch: [hasRoleCodeGuard],
        data: { allowedRoleCodes: stadisticsAdmin }
    },
    {
        path: 'review-tickets-transfer',
        component: ReviewTicketsTransferComponent,
        canActivate: [authGuard],
        canMatch: [hasRoleCodeGuard],
        data: { allowedRoleCodes: stadisticsAdmin}
    },
    {
        path: '**',
        component: OwnerListExpensasComponent,
        canActivate: [authGuard],
        canMatch: [hasRoleCodeGuard],
        data: { allowedRoleCodes: stadisticsAdmin }
    }
];