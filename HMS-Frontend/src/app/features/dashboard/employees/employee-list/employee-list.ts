import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../../core/services/employee.service';
import { Employee } from '../../../../core/models/employee.model';
import { ConfirmModalService } from '../../../../core/services/confirm-modal.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss',
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private confirmModal = inject(ConfirmModalService);
  private toastService = inject(ToastService);

  // ── Data ────────────────────────────────────────────────────
  employees: Employee[] = [];

  // ── Pagination ──────────────────────────────────────────────
  currentPage = 1;
  totalPages = 1;
  totalEmployees = 0;
  limit = 10;

  // ── Filters ─────────────────────────────────────────────────
  statusFilter = '';
  departmentFilter = '';

  // ── Search ──────────────────────────────────────────────────
  searchQuery = '';
  searchResults: Employee[] = [];
  isSearching = false;
  showSearchResults = false;

  // ── Loading ─────────────────────────────────────────────────
  loading = false;

  ngOnInit(): void {
    this.loadEmployees();
  }

  // ────────────────────────────────────────────────────────────
  // LOAD EMPLOYEES (with filters + pagination)
  // ────────────────────────────────────────────────────────────
  loadEmployees(): void {
    this.loading = true;
    this.showSearchResults = false;

    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.departmentFilter) filters.department = this.departmentFilter;

    this.employeeService
      .getEmployees(this.currentPage, this.limit, filters)
      .subscribe({
        next: (res: any) => {
          this.employees = res.data || [];
          this.totalEmployees = res.pagination?.total || 0;
          this.totalPages = res.pagination?.pages || 1;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  // ────────────────────────────────────────────────────────────
  // SEARCH (wired to backend via same getEmployees endpoint)
  // ────────────────────────────────────────────────────────────
  onSearch(): void {
    if (!this.searchQuery || this.searchQuery.trim().length < 2) {
      this.showSearchResults = false;
      this.searchResults = [];
      this.loadEmployees();
      return;
    }

    this.isSearching = true;
    this.showSearchResults = true;

    this.employeeService
      .getEmployees(1, 50, undefined, this.searchQuery.trim())
      .subscribe({
        next: (res: any) => {
          this.searchResults = res.data || [];
          this.isSearching = false;
        },
        error: () => {
          this.isSearching = false;
        },
      });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showSearchResults = false;
    this.searchResults = [];
    this.loadEmployees();
  }

  // ────────────────────────────────────────────────────────────
  // FILTERS
  // ────────────────────────────────────────────────────────────
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadEmployees();
  }

  // ────────────────────────────────────────────────────────────
  // PAGINATION
  // ────────────────────────────────────────────────────────────
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadEmployees();
  }

  // ────────────────────────────────────────────────────────────
  // ACTIONS
  // ────────────────────────────────────────────────────────────
  createEmployee(): void {
    this.router.navigate(['/admin/employees/create']);
  }

  editEmployee(id: string): void {
    this.router.navigate(['/admin/employees/edit', id]);
  }

  /**
   * Toggle ACTIVE / INACTIVE with confirmation modal.
   * Guards against undefined _id with an early return.
   */
  async toggleStatus(employee: Employee): Promise<void> {
    // Guard: ensure we have an ID before proceeding
    const employeeId = employee._id;
    if (!employeeId) {
      this.toastService.error('Employee ID is missing');
      return;
    }

    const newStatus = employee.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const result = await this.confirmModal.open({
      title: newStatus === 'deactivate' ? 'Deactivate Employee' : 'Activate Employee',
      message:
        newStatus === 'deactivate'
          ? `Are you sure you want to deactivate "${employee.name}"? They will no longer appear in active lists.`
          : `Are you sure you want to activate "${employee.name}"?`,
      confirmText: newStatus === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Activate',
      cancelText: 'Cancel',
      type: newStatus === 'deactivate' ? 'warning' : 'info',
    });

    if (!result.confirmed) return;

    this.employeeService.toggleStatus(employeeId).subscribe({
      next: (res: any) => {
        this.toastService.success(
          res.message || `Employee ${res.data?.status?.toLowerCase()} successfully`
        );
        this.loadEmployees();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to update status');
      },
    });
  }
}
