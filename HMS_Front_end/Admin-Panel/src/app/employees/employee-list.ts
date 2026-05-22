import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/user.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchQuery = '';
  filterDepartment = '';

  departments = [
    'OPD',
    'IPD',
    'Lab',
    'Pharmacy',
    'Administration',
    'Reception',
    'Billing',
  ];

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.error = '';

    this.employeeService.getEmployees(this.currentPage, this.itemsPerPage).subscribe({
      next: (response: any) => {
        let employees = response.employees || [];

        if (this.filterDepartment) {
          employees = employees.filter(
            (e: Employee) => e.department === this.filterDepartment
          );
        }

        this.employees = employees;
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load employees';
        this.loading = false;
      },
    });
  }

  filterByDepartment(): void {
    this.currentPage = 1;
    this.loadEmployees();
  }

  searchEmployees(): void {
    if (!this.searchQuery.trim()) {
      this.loadEmployees();
      return;
    }

    this.loading = true;
    this.employeeService.searchEmployees(this.searchQuery).subscribe({
      next: (response: any) => {
        this.employees = response.employees || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Search failed';
        this.loading = false;
      },
    });
  }

  viewEmployee(id: string): void {
    this.router.navigate(['/employees', id]);
  }

  editEmployee(id: string): void {
    this.router.navigate(['/employees/edit', id]);
  }

  deleteEmployee(id: string): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.employees = this.employees.filter((e) => e._id !== id);
          alert('Employee deleted successfully');
        },
        error: (err: any) => {
          alert(err.error?.message || 'Failed to delete employee');
        },
      });
    }
  }

  createNewEmployee(): void {
    this.router.navigate(['/employees/create']);
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
      this.loadEmployees();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEmployees();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
}
