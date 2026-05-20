import { Component ,OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperationReportTotalService } from '../../service/dashboard/OperationReportTotal/operation-report-total.service';
@Component({
  selector: 'app-operation-report',
  imports: [CommonModule],
  templateUrl: './operation-report.component.html',
  styleUrl: './operation-report.component.css'
})
export class OperationReportComponent implements OnInit {
  constructor(private operationReportService: OperationReportTotalService) {}
  operationReport: { appointmentno: number; employeeno: number; billingno: number; appointments: any[]; employees: any[]; billings: any[] } = {
    appointmentno: 0,
    employeeno: 0,
    billingno: 0,
    appointments: [],
    employees: [],
    billings: [],
  };

  ngOnInit(): void {
    this.operationReportService.getDashboardData().subscribe((data) => {
      // Handle the retrieved data
      this.operationReport = data;
    });
  }
}
