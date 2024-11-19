import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  RouterModule,
  RouterOutlet,
  Router,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import {
  MainLayoutComponent,
  NavbarItem,
  ToastsContainer,
} from 'ngx-dabd-grupo01';
import { LoginComponent } from './users/components/login/login.component';
import { SessionService } from './users/services/session.service';
import { LoginService } from './users/services/login.service';
import { ForgotPasswordComponent } from './users/components/forgot-password/forgot-password.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NotificationsComponent } from './notifications/modules/components/notifications/notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    MainLayoutComponent,
    ToastsContainer,
    AsyncPipe,
    LoginComponent,
    NotificationsComponent,
    ForgotPasswordComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // title = 'AppName';
  showNotifications: boolean = false;
  // Modo Oscuro
  darkModeEnabled = false;
  //variables
  navbarMenu: NavbarItem[] = [
    {
      label: 'Accesos',
      routerLink: 'entries',
      sidebarMenu: [
        {
          label: 'Listado de Entidades',
          routerLink: 'entries/entity/list',
        },
        {
          label: 'Listado de Accesos',
          routerLink: 'entries/access-query',
        },
        {
          label: 'Listado de Autorizaciones',
          routerLink: 'entries/auth-list',
        },
        {
          label: 'Dashboards',
          routerLink: 'entries/dashboard',
        },
      ],
    },
    {
      label: 'Boletas',
      routerLink: '/invoices',
      sidebarMenu: [
        {
          label: 'Lista de Expensas (Admin)',
          routerLink: '/invoices/admin-list-expensas',
        },
        {
          label: 'Lista de Expensas (Propietario)',
          routerLink: '/invoices/owner-list-expensas',
        },
        {
          label: 'Estadísticas', subMenu: [
            {
              label: 'Tickets',
              routerLink: '/invoices/stadistics/1',
            },
            {
              label: 'Pagos',
              routerLink: '/invoices/stadistics/2',
            },

          ],
        },

      ],
    },
    {
      label: 'Construcciones',
      routerLink: '/home',
      sidebarMenu: [
        {
          label: 'Administración',
          subMenu: [
            {
              label: 'Listado de Obras',
              routerLink: '/penalties/constructions',
            },
          ],
        },
        {
          label: 'Reportes',
          subMenu: [
            {
              label: 'Reporte de obras',
              routerLink: '/penalties/constructions-report',
            },
          ],
        },
      ],
    },
    {
      label: 'Contactos',
      routerLink: 'notifications/contacts',
      sidebarMenu: [
        {
          label: 'Listado de Contactos',
          routerLink: 'notifications/contacts',
        },
        {
          label: 'Registrar Contacto',
          routerLink: 'notifications/contact/new',
        },
        {
          label: 'Auditoría de Contactos',
          routerLink: 'notifications/contact-audit',
        },
      ],
    },
    {
      label: 'Empleados',
      routerLink: 'inventories/employees',
      sidebarMenu: [
        {
          label: 'Gráficos',
          routerLink: 'inventories/employees/dashboard',
        },
        {
          label: 'Lista',
          routerLink: 'inventories/employees/list',
        },
        {
          label: 'Registrar',
          routerLink: 'inventories/employees/form',
        },
      ],
    },
    {
      label: 'Gastos', //expensas
      routerLink: 'expenses',
      sidebarMenu: [
        {
          label: 'Gastos',
          subMenu: [
            { label: 'Listado de gastos', routerLink: 'expenses/gastos' },
            {
              label: 'Categorias de gastos',
              routerLink: 'expenses/gastos/categorias',
            },
            {
              label: 'Reporte de gastos',
              routerLink: 'expenses/gastos/report',
            },
          ],
        },
        {
          label: 'Cargos',
          subMenu: [
            { label: 'Listado de cargos', routerLink: 'expenses/cargos' },
            {
              label: 'Categorias de cargos',
              routerLink: 'expenses/cargos/categorias',
            },
          ],
        },
        {
          label: 'Periodo',
          subMenu: [
            { label: 'Listado de periodos', routerLink: 'expenses/periodo' },
            { label: 'Histórico de expensas', routerLink: 'expenses/expenses' },
            {
              label: 'Reporte de expensas',
              routerLink: 'expenses/expenses/report',
            },
          ],
        },
      ],
    },
    {
      label: 'Inventario',
      routerLink: 'inventories/inventory',
      sidebarMenu: [
        {
          label: 'Gráficos',
          routerLink: 'inventories/inventory/dashboard',
        },
        {
          label: 'Lista',
          routerLink: 'inventories/inventories',
        },
        {
          label: 'Registrar',
          routerLink: 'inventories/articles/article',
        },
        {
          label: 'Configuración',
          routerLink: 'inventories/inventories/config',
          subMenu: [
            {
              label: 'Categorías',
              routerLink: 'inventories/inventories/config/category',
            },
          ],
        },
      ],
    },
    // {
    //   label: 'Normas',
    //   routerLink: '/penalties/rules',
    //   sidebarMenu: [
    //     {
    //       label: 'Reglamento',
    //       routerLink: '/penalties/rules',
    //     }
    //   ]
    // },
    {
      label: 'Notificaciones',
      routerLink: 'notifications/send-email',
      sidebarMenu: [
        {
          label: 'Listado de Plantillas',
          routerLink: 'notifications/templates',
        },
        {
          label: 'Registrar Plantillas',
          routerLink: 'notifications/templates/new',
        },
        {
          label: 'Enviar Notificación',
          routerLink: 'notifications/send-email',
        },
        {
          label: 'Notificación Múltiple',
          routerLink: 'notifications/send-email-contact',
        },
        {
          label: 'Histórico',
          routerLink: 'notifications/notifications-historic',
        },
        {
          label: 'Reporte de Notificaciones',
          routerLink: 'notifications/notification/charts',
        },
        {
          label: 'Mis Notificaciones',
          routerLink: 'notifications/my-notification',
        },
      ],
    },
    {
      label: 'Moderación',
      routerLink: '/home',
      sidebarMenu: [
        {
          label: 'Administración',
          subMenu: [
            { label: 'Listado de Multas', routerLink: '/penalties/fine' },
            {
              label: 'Listado de Infracciones',
              routerLink: '/penalties/infraction',
            },
            { label: 'Listado de Reclamos', routerLink: '/penalties/claim' },
            {
              label: 'Tipos de Sanciones',
              routerLink: '/penalties/sanctionType',
            },
          ],
        },
        {
          label: 'Reportes',
          subMenu: [
            {
              label: 'Reporte de Multas',
              routerLink: '/penalties/fine-report',
            },
            {
              label: 'Reporte de Infracciones',
              routerLink: '/penalties/infraction-report',
            },
            {
              label: 'Reporte de Reclamos',
              routerLink: '/penalties/claim-report',
            },
          ],
        },
      ],
    },
    {
      label: 'Proveedores',
      routerLink: 'inventories/providers',
      sidebarMenu: [
        {
          label: 'Gráficos',
          routerLink: 'inventories/providers/dashboard',
        },
        {
          label: 'Lista',
          routerLink: 'inventories/providers/list',
        },
        {
          label: 'Registrar',
          routerLink: 'inventories/providers/form',
        },
        {
          label: 'Configuración',
          routerLink: 'inventories/providers/config',
          subMenu: [
            {
              label: 'Empresas',
              routerLink: 'inventories/providers/config/company',
            },
            {
              label: 'Servicios',
              routerLink: 'inventories/providers/config/service',
            },
          ],
        },
      ],
    },
    {
      label: 'Usuarios',
      routerLink: 'users',
      sidebarMenu: [
        {
          label: 'Dashboards',
          subMenu: [
            {
              label: 'Reporte Propietarios',
              routerLink: '/users/owner/reports',
            },
            { label: 'Reporte Usuarios', routerLink: '/users/user/reports' },
          ],
        },
        // {
        //   label: 'Perfil',
        //   subMenu: [
        //     {
        //       label: 'Consultar Perfil',
        //       routerLink: '/users/profile/detail',
        //     },
        //     {
        //       label: 'Editar Perfil',
        //       routerLink: '/users/profile/edit',
        //     },
        //     {
        //       label: 'Cambiar contraseña',
        //       routerLink: '/users/changepassword',
        //     },
        //   ],
        // },
        {
          label: 'Propietarios',
          subMenu: [
            { label: 'Listado de Propietarios', routerLink: '/users/owner/list' },
            { label: 'Cargar Propietario', routerLink: '/users/owner/form' },
            { label: 'Asignar Lote', routerLink: '/users/owner/assign' },
            { label: 'Cargar Archivo', routerLink: '/users/files/form' },
            { label: 'Validar Archivos', routerLink: '/users/files/view' },
          ],
        },
        {
          label: 'Lotes',
          subMenu: [
            { label: 'Listado de Lotes', routerLink: '/users/plot/list' },
            { label: 'Cargar Lote', routerLink: '/users/plot/form' },
          ],
        },
        {
          label: 'Usuarios',
          subMenu: [
            { label: 'Listado de Usuarios', routerLink: '/users/user/list' },
            { label: 'Cargar Usuario', routerLink: '/users/user/form' },
            {
              label: 'Cargar Inquilino',
              routerLink: '/users/user/tenant/form',
            },
            { label: 'Listado de Roles', routerLink: '/users/roles/list' },
            /*   { label: 'Cargar Roles', routerLink: '/users/roles/form' }, */
            { label: 'Usuarios Creados', routerLink: '/users/user/created' },
            { label: 'Usuarios por Rol', routerLink: '/users/user/role' },
          ],
        },
      ],
    },
  ];

  //#region LOGIN
  /**
   * Service responsible for managing user session and authentication state.
   */
  private sessionService = inject(SessionService);
  private router = inject(Router);

  /**
   * Observable that emits the current authentication status.
   * This observable updates automatically whenever the session state changes,
   * providing real-time authentication status across components.
   */
  isAuthenticated$ = this.sessionService.isAuthenticated$;

  /**
   * Maneja el evento de clic en el botón de cierre de sesión.
   *
   * Este método llama al servicio de autenticación para cerrar la sesión
   * del usuario, eliminando su sesión y actualizando el estado de autenticación.
   * Es utilizado típicamente para limpiar cualquier dato de sesión almacenado
   * y redirigir al usuario a una vista de inicio de sesión o pantalla principal.
   */
  onLogoutButtonClick() {
    this.sessionService.logout();
    this.router.navigate(['']);
  }
  //#endregion

  openProfile() {
    this.router.navigate(['/users/profile/detail']);
  }

  currentUrl$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects)
  );

  onNotificationClick() {
    this.showNotifications = !this.showNotifications;
  }

  //Modo Oscuro
  toggleDarkMode() {
    this.darkModeEnabled = !this.darkModeEnabled;
    if (this.darkModeEnabled) {
      document.body.classList.add('dark-mode'); // Agrega clase al body
    } else {
      document.body.classList.remove('dark-mode'); // Remueve clase del body
    }
  }
}
