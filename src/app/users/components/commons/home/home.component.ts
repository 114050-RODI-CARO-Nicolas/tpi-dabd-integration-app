import { inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  MainContainerComponent,
  TableComponent,
  ToastService,
} from 'ngx-dabd-grupo01';
import { FormsModule, NgForm } from '@angular/forms';
import {
  NgbModal,
  NgbPagination,
  NgbPaginationConfig,
} from '@ng-bootstrap/ng-bootstrap';
import { Notice, NoticeService } from '../../../services/notice.service';
import { SessionService } from '../../../services/session.service';

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  weather: [
    {
      description: string;
      icon: string;
    }
  ];
  dt_txt?: string;
}

interface ForecastData {
  list: WeatherData[];
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'alto' | 'medio' | 'bajo';
  date?: string;
  isVisible: boolean;
}

const weatherTranslations: { [key: string]: string } = {
  'clear sky': 'Cielo despejado',
  'few clouds': 'Pocas nubes',
  'scattered clouds': 'Nubes dispersas',
  'broken clouds': 'Nublado parcial',
  'shower rain': 'Lluvia fuerte',
  rain: 'Lluvia',
  dust: 'Polvo',
  thunderstorm: 'Tormenta eléctrica',
  snow: 'Nieve',
  mist: 'Neblina',
  'overcast clouds': 'Nublado total',
  'light rain': 'Lluvia ligera',
  hot: 'Calor',
  warm: 'Cálido',
  mild: 'Templado',
  cool: 'Fresco',
  cold: 'Frío',
  freezing: 'Muy Frío',
  chilly: 'Muy Frío',
  breezy: 'Viento suave',
  windy: 'Viento fuerte',
  humid: 'Húmedo',
  dry: 'Seco',
  heatwave: 'Ola de calor',
  'cold snap': 'Ola de frío',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MainContainerComponent,
    TableComponent,
    FormsModule,
    NgbPagination,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe],
})
export class HomeComponent implements OnInit {
  @ViewChild('announcementModal') announcementModal: any;
  @ViewChild('deleteModal') deleteModal: any;

  visibility: boolean = false;
  adminRoles: number[] = [999, 100];
  userName: string = '';
  weather: WeatherData | null = null;
  activeFilter: 'all' | 'active' | 'inactive' = 'all';
  forecast: WeatherData[] = [];
  announcements: Announcement[] = [];
  currentUserId = 1;

  announcementToDelete: Announcement | null = null;
  isEditing = false;
  newAnnouncement: Notice = {
    title: '',
    content: '',
    priority: 'MEDIUM',
    is_active: true,
    date: new Date().toISOString(),
  };

  pagedAnnouncements: Announcement[] = [];
  currentPage: number = 1;
  pageSize: number = 4;
  totalPages: number = 1;
  totalElements: number = 0;

  private toastService = inject(ToastService);
  constructor(
    private http: HttpClient,
    private noticeService: NoticeService,
    private modalService: NgbModal,
    private paginationConfig: NgbPaginationConfig,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.getWeather();
    this.getForecast();
    this.loadAnnouncements();
    this.checkVisibility();
    this.userName = this.getUserSession();
  }

  getUserSession() {
    const user = sessionStorage.getItem('user');
    console.log('Usuario logueado: ', user);
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser.value.first_name;
    }
  }

  checkVisibility() {
    this.visibility = this.sessionService.hasRoleCodes(this.adminRoles);
  }

  loadAnnouncements(isActive?: boolean): void {
    this.announcements = [];
    this.noticeService
      .getAllNotices(this.currentPage - 1, this.pageSize, isActive)
      .subscribe({
        next: (response) => {
          this.announcements = response.content.map((notice) => ({
            ...notice,
            priority: translatePriority(notice.priority),
          }));
  
          this.announcements.sort((a, b) => {
            const dateA = new Date(a.date || '').getTime();
            const dateB = new Date(b.date || '').getTime();
            return dateB - dateA; // Orden descendente
          });
  
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
        },
        error: (error) => {
          console.error('Error loading announcements:', error);
          this.toastService.sendError('Ocurrió al cargar las noticias');
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.filterAnnouncements(this.activeFilter);
  }

  updatePagedAnnouncements(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedAnnouncements = this.announcements.slice(startIndex, endIndex);
  }

  filterAnnouncements(filter: 'all' | 'active' | 'inactive') {
    this.activeFilter = filter;
    switch (filter) {
      case 'active':
        this.loadAnnouncements(true);
        break;
      case 'inactive':
        this.loadAnnouncements(false);
        break;
      default:
        this.loadAnnouncements();
        break;
    }
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  openModal(content: any) {
    this.modalService.open(content, { size: 'lg' });
  }

  editAnnouncement(announcement: Announcement) {
    this.noticeService.getNoticeById(announcement.id).subscribe({
      next: (notice) => {
        this.newAnnouncement = { ...notice };
        this.isEditing = true;
        this.openModal(this.announcementModal);
      },
      error: (error) => {
        console.error('Error loading announcement details:', error);
        this.toastService.sendError('Ocurrió un error al editar la noticia');
      },
    });
  }

  confirmDelete(announcement: Announcement) {
    this.announcementToDelete = announcement;
    this.modalService.open(this.deleteModal);
    this.totalElements = 0;
    this.totalPages = 1;
    this.toastService.sendSuccess('Noticia desactivada con éxito');
  }

  deleteAnnouncement() {
    if (this.announcementToDelete) {
      this.noticeService
        .softDeleteNotice(this.announcementToDelete.id, this.currentUserId)
        .subscribe({
          next: () => {
            this.modalService.dismissAll();
            this.filterAnnouncements(this.activeFilter);
            this.announcementToDelete = null;
          },
          error: (error) => {
            console.error('Error deleting announcement:', error);
            this.toastService.sendError(
              'Ocurrió un error al desactivar la noticia'
            );
          },
        });
    }
  }

  submitAnnouncement() {
    const operation = this.isEditing
      ? this.noticeService.updateNotice(
          this.newAnnouncement,
          this.currentUserId
        )
      : this.noticeService.createNotice(
          this.newAnnouncement,
          this.currentUserId
        );
  
    operation.subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.filterAnnouncements(this.activeFilter);
        this.resetForm();
  
        if (this.isEditing) {
          this.toastService.sendSuccess('La noticia se editó con éxito.');
        } else {
          this.toastService.sendSuccess('La noticia se creó con éxito.');
        }
      },
      error: (error) => {
        console.error('Error saving announcement:', error);
        this.toastService.sendError('Ocurrió un error, intente más tarde');
      },
    });
  }

  private resetForm() {
    this.newAnnouncement = {
      title: '',
      content: '',
      priority: 'MEDIUM',
      is_active: true,
      date: new Date().toISOString(),
    };
    this.isEditing = false;
  }

  getWeather() {
    const apiKey = '19f297409130d09871fbdbf5922cfae5';
    const city = 'Cordoba,AR';

    this.http
      .get<WeatherData>(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
      )
      .subscribe(
        (data) => {
          this.weather = data;
          if (this.weather && this.weather.weather[0]) {
            this.weather.weather[0].description =
              weatherTranslations[
                this.weather.weather[0].description.toLowerCase()
              ] || this.weather.weather[0].description;
          }
        },
        (error) => {
          console.error('Error fetching weather data', error);
          this.toastService.sendError('Ocurrió al cargar el clima');
        }
      );
  }

  getForecast() {
    const apiKey = '19f297409130d09871fbdbf5922cfae5';
    const city = 'Cordoba,AR';

    this.http
      .get<ForecastData>(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`
      )
      .subscribe(
        (data) => {
          const dailyForecasts = data.list.reduce(
            (acc: WeatherData[], curr) => {
              const date = new Date(curr.dt_txt || '').toLocaleDateString();
              if (
                !acc.find(
                  (item) =>
                    new Date(item.dt_txt || '').toLocaleDateString() === date
                )
              ) {
                // Traducir la descripción
                if (curr.weather[0]) {
                  curr.weather[0].description =
                    weatherTranslations[
                      curr.weather[0].description.toLowerCase()
                    ] || curr.weather[0].description;
                }
                acc.push(curr);
              }
              return acc;
            },
            []
          );

          this.forecast = dailyForecasts.slice(0, 3);
        },
        (error) => {console.error('Error fetching forecast data', error)
          this.toastService.sendError('Ocurrió un error al cargar el clima');
        }
      );
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  }
}

export function translatePriority(priority: 'high' | 'medium' | 'low'): 'alto' | 'medio' | 'bajo' {
  switch (priority) {
    case 'high':
      return 'alto';
    case 'medium':
      return 'medio';
    case 'low':
      return 'bajo';
    default:
      return 'medio';
  }
}
