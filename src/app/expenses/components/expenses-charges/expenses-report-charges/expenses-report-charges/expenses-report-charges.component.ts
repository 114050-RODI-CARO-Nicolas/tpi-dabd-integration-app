import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NgPipesModule} from "ngx-pipes";
import {MainContainerComponent, TableComponent, TableFiltersComponent} from "ngx-dabd-grupo01";
import {
  ChartData,
  ChartType,
} from 'chart.js';
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: 'app-expenses-report-charges',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, TableComponent, NgPipesModule, MainContainerComponent, TableFiltersComponent, BaseChartDirective
  ],
  templateUrl: './expenses-report-charges.component.html',
  styleUrl: './expenses-report-charges.component.css'
})
export class ExpensesReportChargesComponent {
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Cargos Totales por Lote' }
    ]
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Cargos Totales por Lote' }
    ]
  };

  selectPeriod : number = 0;

  ngOnInit(): void {
    this.loadChargesData();
  }

  loadChargesData(): void {
    const periodId = this.selectPeriod;
  }

}
