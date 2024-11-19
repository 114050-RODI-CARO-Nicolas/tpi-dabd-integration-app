import { Routes } from '@angular/router';
import { LiquidationExpenseDetailsComponent } from './components/expenses-period/expenses-liquidation-details/expenses-liquidation-details.component';
import { ExpensesLiquidationComponent } from './components/expenses-period/expenses-liquidation/expenses-liquidation.component';
import { ExpensesListComponent } from './components/expenses-period/expenses-list/expenses-list.component';
import {
  ExpensesListChargesComponent
} from "./components/expenses-charges/expenses-list-charges/expenses-list-charges.component";
import {
  ExpensesAddChargeComponent
} from "./components/expenses-charges/expenses-add-charge/expenses-add-charge.component";
import {ExpensesAddBillComponent} from "./components/expenses-bills/expenses-add-bill/expenses-add-bill.component";
import {
  ExpensesCategoryBillComponent
} from "./components/expenses-bills/expenses-category-bill/expenses-category-bill.component";
import {
  ExpensesPeriodListComponent
} from "./components/expenses-period/expenses-period-list/expenses-period-list.component";

import {
  ExpensesReportComponent
} from "./components/expenses-period/expenses-report/expenses-report/expenses-report.component";

import { ExpensesListBillsComponent } from './components/expenses-bills/expenses-list-bills/expenses-list-bills.component';
import {authGuard} from '../users/guards/auth.guard';
import {hasRoleCodeGuard} from '../users/guards/has-role-code.guard';
import {URLTargetType} from '../users/models/role';
import { ExpensesListCategoryChargesComponent } from './components/expenses-charges/expenses-list-category-charges/expenses-list-categorycharge.component';
import {
  ExpensesPeriodReportComponent
} from './components/expenses-period/expenses-period-report/expenses-period-report.component';

export const EXPENSES_ROUTES: Routes = [
  // Ruta periodos - manejo del estado del periodo
  {
    path: '',
    component: ExpensesReportComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'periodo',
    component: ExpensesPeriodListComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'periodo/:period_id/expensas',
    component: ExpensesListComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'periodo/:period_id/liquidacion',
    component: ExpensesLiquidationComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'periodo/:period_id/gastos',
    component: LiquidationExpenseDetailsComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },

  // Ruta expenses - CRUD de expensas
  { path: 'expenses',
    component: ExpensesListComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'expenses/report',
    component: ExpensesReportComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'expenses/nuevo',
    component: ExpensesListChargesComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'expenses/modificar/:id',
    component: ExpensesListChargesComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },

  // Rutas cargos - CRUD de cargos
  {
    path: 'cargos', component: ExpensesListChargesComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'cargos/nuevo',
    component: ExpensesAddChargeComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'cargos/modificar/:id',
    component: LiquidationExpenseDetailsComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'cargos/categorias',
    component: ExpensesListCategoryChargesComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },

  // Ruta bills - CRUD de gastos
  {
    path: 'gastos',
    component: ExpensesListBillsComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'gastos/nuevo',
    component: ExpensesAddBillComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'gastos/report',
    component: ExpensesPeriodReportComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'gastos/modificar/:id',
    component: ExpensesAddBillComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
  {
    path: 'gastos/categorias',
    component: ExpensesCategoryBillComponent,
    canActivate: [authGuard],
    canMatch: [hasRoleCodeGuard],
    data: {
      allowedRoleCodes: [URLTargetType.SUPERADMIN, URLTargetType.FINANCE, URLTargetType.FINANCE_ASSISTANT]
    }
  },
];

