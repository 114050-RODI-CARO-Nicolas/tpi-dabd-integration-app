import { environment } from "../../../environments/environment";

export const PORTInventory = environment.production ? `${environment.apis.inventory}` : `${environment.apis.inventory}`

export const PORTEmployees = environment.production ? `${environment.apis.employees}` : `${environment.apis.employees}`

export const PORTSuppliers = environment.production ? `${environment.apis.suppliers}` : `${environment.apis.suppliers}`