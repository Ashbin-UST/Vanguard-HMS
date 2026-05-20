import { Component, OnInit } from '@angular/core';
import { AppointmentslistService } from '../../service/appointments/appointmentslist.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css'],
  imports: [CommonModule]
})
export class AppointmentListComponent implements OnInit {
  appointments: any[] = [];

  constructor(private appointmentService: AppointmentslistService) {}

  ngOnInit(): void {
    this.appointmentService.getContent().subscribe(data => {
      this.appointments = data;
    });
  }
}
