import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  BaseChartDirective
} from 'ng2-charts';

import {
  ChartConfiguration,
  ChartOptions
} from 'chart.js';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);
@Component({
  selector: 'app-chart',
  standalone: true,

  imports: [
    CommonModule,
    BaseChartDirective
  ],

  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent {

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      {
        data: [65, 59, 80, 81],
        label: 'Sales'
      }
    ]
  };

}