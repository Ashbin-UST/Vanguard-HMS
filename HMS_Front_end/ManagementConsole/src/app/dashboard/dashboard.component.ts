import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from './chart/chart.component';
import {AppointmentListComponent} from './appointment-list/appointment-list.component';
import { OperationReportComponent } from './operation-report/operation-report.component';
@Component({
  selector: 'app-dashboard',
  imports: [ OperationReportComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  }