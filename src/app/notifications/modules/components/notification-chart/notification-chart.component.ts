import { Component, inject, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { KPIModel, RetentionKPIs } from '../../../models/kpi/kpiModel';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MainContainerComponent } from 'ngx-dabd-grupo01';
import { IaService } from '../../../services/ia-service';
import { ChartData, ChartOptions } from 'chart.js';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ContactTypeMetricService } from '../../../services/dashboard/charts/contact-type-metric.service';
import { NotificationStatusMetricService } from '../../../services/dashboard/charts/notification-status-metric.service';
import { NotificationWeeklyMetricService } from '../../../services/dashboard/charts/notification-weekly-metric.service';
import { SubscriptionRetentionMetricService } from '../../../services/dashboard/charts/suscription-retention-metric.service';
import { SubscriptionOptionalAnalysisMetricService } from '../../../services/dashboard/charts/suscription-optional-analysis-metric.service';
import { NotificationKPIViewedModel } from '../../../models/notifications/notification';
import { KpiViewedRateService } from '../../../services/dashboard/kpi/kpi-viewed-rate.service';
import { KpiDailyAverageService } from '../../../services/dashboard/kpi/kpi-dayli-average.service';
import { KpiPeakTimeService, PeakHourStats } from '../../../services/dashboard/kpi/kpi-peak-time.service';
import { FrequentContactStats, KpiMostFrequentContactService } from '../../../services/dashboard/kpi/kpi-most-frequent-contact.service';
import { ActiveDayStats, KpiMostDayliActiveService } from '../../../services/dashboard/kpi/kpi-most-dayli-active.service';
import { KpiAverageRetentionService } from '../../../services/dashboard/kpi/kpi-retention-optional-notifications.service';
import { KpiHighestRetentionService } from '../../../services/dashboard/kpi/kpi-highest-retention.service';

@Component({
  selector: 'app-notification-chart',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    BaseChartDirective,
    MainContainerComponent,
    RouterModule
  ],
  templateUrl: './notification-chart.component.html',
  styleUrl: './notification-chart.component.css'
})


export class NotificationChartComponent implements OnInit {


  constructor(
    private contactTypeMetricService: ContactTypeMetricService,
    private notificationStatusMetricService: NotificationStatusMetricService,
    private weeklyMetricService: NotificationWeeklyMetricService,
    private subscriptionRetentionMetricService: SubscriptionRetentionMetricService,
    private subscriptionOptionalAnalysisMetricService: SubscriptionOptionalAnalysisMetricService,
    private kpiViewedRateService: KpiViewedRateService,
    private kpiDailyAverageService: KpiDailyAverageService,
    private kpiPeakTimeService: KpiPeakTimeService,
    private kpiMostFrequentContactService: KpiMostFrequentContactService,
    private kpiMostDayliActiveService: KpiMostDayliActiveService,
    private kpiAverageRetentionService: KpiAverageRetentionService,
    private kpiHighestRetentionService: KpiHighestRetentionService

  ) {

    this.chartOptionsContactType = this.contactTypeMetricService.getContactTypeChartOptions();
    this.chartOptionsNotificationStatus = this.notificationStatusMetricService.getChartOptions();
    this.chartOptionsNotificationWeekly = this.weeklyMetricService.getChartOptions();
    this.chartOptionsSuscriptionRetention = this.subscriptionRetentionMetricService.getChartOptions();
    this.chartOptionsSubscriptionOptionalAnalysis = this.subscriptionOptionalAnalysisMetricService.getChartOptions();


  }


  private destroy$ = new Subject<void>();

  chartDataContactType!: ChartData<'pie'>;
  chartOptionsContactType: ChartOptions<'pie'>;
  chartDataNotificationStatus!: ChartData<'pie'>;
  chartOptionsNotificationStatus: ChartOptions<'pie'>;
  chartDataNotificationWeekly!: ChartData<'bar'>;
  chartOptionsNotificationWeekly!: ChartOptions<'bar'>;
  chartDataSuscriptionRetention!: ChartData<'bar'>;
  chartOptionsSuscriptionRetention: ChartOptions<'bar'>;
  chartDataSubscriptionOptionalAnalysis!: ChartData<'bar'>;
  chartOptionsSubscriptionOptionalAnalysis: ChartOptions<'bar'>;

  today = new Date().toISOString().split('T')[0];
  isDropdownOpen = false;
  dateFrom: string | null = null;
  dateUntil: string | null = null;
  selectedStatus: 'ALL' | 'SENT' | 'VISUALIZED' = 'ALL';
  viewedRate: number = 0;
  viewedCount: number = 0;
  totalCount: number = 0;
  dailyAverage: number = 0;
  peakHour: PeakHourStats = {
    hour: 0,
    count: 0
  };
  frequentContact: FrequentContactStats = {
    email: '',
    count: 0
  };
  mostActiveDay: ActiveDayStats = {
    day: '',
    count: 0,
    percentage: 0
  };
  averageRetention: number = 0;


  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  notificationService = inject(NotificationService);
  iaService = inject(IaService);

  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';


  retentionKPIs: RetentionKPIs = {
    averageRetention: 0,
    highestRetention: '',
    lowestRetention: '',
    subscriptionsAbove80: 0
  };


  isTooltipOpen = false;
  isLoading = false;
  iaResponse = '';
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }


  kpis!: KPIModel;

  notifications: NotificationKPIViewedModel[] = []

  ngOnInit() {

    this.setInitialDateFilters();

    this.contactTypeMetricService.getContactTypeChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.chartDataContactType = data;
      });

    this.notificationStatusMetricService.getChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.chartDataNotificationStatus = data;
      });

    this.weeklyMetricService.getChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.chartDataNotificationWeekly = data;
      });

    this.subscriptionRetentionMetricService.getChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.chartDataSuscriptionRetention = data;
      });

    this.subscriptionRetentionMetricService.loadData()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.subscriptionOptionalAnalysisMetricService.getChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.chartDataSubscriptionOptionalAnalysis = data;
      });

    this.kpiViewedRateService.getViewedStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.viewedRate = stats.viewedRate;
        this.viewedCount = stats.viewed;
        this.totalCount = stats.total;
      });

    this.kpiDailyAverageService.getDailyAverage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(average => {
        this.dailyAverage = average;
      });

    this.kpiPeakTimeService.getPeakHourStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.peakHour = stats;
      });

    this.kpiMostFrequentContactService.getFrequentContactStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.frequentContact = stats;
      });

    this.kpiMostDayliActiveService.getMostActiveDay()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.mostActiveDay = stats;
      });

    this.kpiAverageRetentionService.getRetentionStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.retentionKPIs.averageRetention = stats.averageRetention;
      });

    this.kpiHighestRetentionService.getRetentionStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.retentionKPIs.highestRetention = stats.highestRetentionSubscription || '';
      })

    this.loadData();


  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  applyFilters(): void {
    this.updateDateFilter();
    this.isDropdownOpen = false;
  }



  resetFilters(): void {
    this.dateFrom = null;
    this.dateUntil = null;
    this.selectedStatus = 'ALL';
    this.notificationStatusMetricService.resetFilters();
    this.subscriptionRetentionMetricService.resetData();
    this.subscriptionOptionalAnalysisMetricService.resetData();
    this.weeklyMetricService.resetData();
    this.kpiViewedRateService.resetStats();
    this.kpiDailyAverageService.resetStats();
    this.kpiMostDayliActiveService.resetStats();
    this.kpiMostFrequentContactService.resetStats();
    this.kpiPeakTimeService.resetStats();
    this.kpiViewedRateService.resetStats();


  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dateFrom'] || changes['dateUntil']) {
      this.updateDateFilter();
    }
  }

  private updateDateFilter(): void {

    this.kpiViewedRateService.updateFilters({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil,
      selectedStatus: this.selectedStatus
    });

    this.kpiDailyAverageService.updateDateFilter({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil
    });

    this.kpiPeakTimeService.updateDateFilter({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil
    });

    this.kpiMostFrequentContactService.updateDateFilter({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil
    });

    this.kpiMostDayliActiveService.updateDateFilter({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil
    });

    this.kpiAverageRetentionService.updateDateFilter({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil
    });

    this.weeklyMetricService.updateDateFilter({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil
    });

    this.notificationStatusMetricService.updateFilters({
      dateFrom: this.dateFrom,
      dateUntil: this.dateUntil,
      selectedStatus: this.selectedStatus
    });

  }

  loadData(): void {
    this.kpiViewedRateService.loadNotificationStats();
    this.kpiDailyAverageService.loadNotifications();
    this.kpiPeakTimeService.loadNotifications();
    this.kpiMostFrequentContactService.loadNotifications();
    this.kpiMostDayliActiveService.loadNotifications();
    this.kpiAverageRetentionService.loadData();
    this.kpiHighestRetentionService.loadData();
    this.subscriptionOptionalAnalysisMetricService.loadData();
    this.subscriptionRetentionMetricService.loadData();
    this.weeklyMetricService.loadData();
    this.notificationStatusMetricService.loadNotifications();


  }

  showInfo() {

    const message = '';
    this.showModal('Información', message);
  }

  showModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  toggleTooltip() {
    this.isTooltipOpen = !this.isTooltipOpen;
    if (this.isTooltipOpen) {
      this.fetchIaResponse();
    }
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.dateFrom) count++;
    if (this.dateUntil) count++;
    if (this.selectedStatus !== 'ALL') count++;
    return count;
  }

  exportDashboardData(): string {
    const data = {
      kpis: this.kpis,
      notifications: this.notifications,
    };
    return JSON.stringify(data);
  }

  fetchIaResponse() {
    this.isLoading = true;
    this.iaService.analyzdeDashboard(this.exportDashboardData()).subscribe({
      next: (response) => {
        this.iaResponse = response;
        this.isLoading = false;
      },
      error: () => {
        this.iaResponse = 'Error al obtener respuesta del asistente.';
        this.isLoading = false;
      }
    });
  }

  setInitialDateFilters() {

    return this.notificationService.getAllNotificationsNotFiltered().subscribe((data) => {
      this.notifications = data;

      const today = new Date();
      this.dateFrom = this.formatDate(today);

      const tomorrow = new Date(today);
      today.setDate(today.getDate() + 2);
      tomorrow.setDate(today.getDate());
      this.dateUntil = this.formatDate(tomorrow);

      if (this.isBrowser) {

      }
    });

  }

}
