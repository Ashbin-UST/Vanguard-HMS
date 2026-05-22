import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  loading = false;
  error = '';
  
  stats: any = {
    totalPatients: 0,
    totalEmployees: 0,
    totalAppointments: 0,
    totalBills: 0,
    paidBills: 0,
    pendingApprovals: 0,
  };

  recentActivities: any[] = [];

  constructor(
    private readonly adminService: AdminService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getDashboardData().subscribe({
      next: (response: any) => {
        this.stats = response.stats || this.stats;
        this.recentActivities = response.recentActivities || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load dashboard data';
        this.loading = false;
      },
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
