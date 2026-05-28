import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalService } from '../../../core/services/confirm-modal.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss'
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);

  patients: Patient[] = [];
  loading = false;

  currentPage = 1;
  totalPages = 1;
  totalPatients = 0;
  limit = 10;

  statusFilter = '';
  genderFilter = '';

  searchQuery = '';
  searchResults: Patient[] = [];
  isSearching = false;
  showSearchResults = false;

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.showSearchResults = false;
    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.genderFilter) filters.gender = this.genderFilter;

    this.patientService.getAllPatients(
      this.currentPage, this.limit, filters
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.patients = response.data;
          this.totalPatients = response.pagination?.total || 0;
          this.totalPages = response.pagination?.pages || 1;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    if (!this.searchQuery || this.searchQuery.trim().length < 2) {
      this.showSearchResults = false;
      this.loadPatients();
      return;
    }
    this.isSearching = true;
    this.showSearchResults = true;

    this.patientService.searchPatients(this.searchQuery.trim()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.searchResults = response.data;
        }
        this.isSearching = false;
      },
      error: () => { this.isSearching = false; }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showSearchResults = false;
    this.searchResults = [];
    this.loadPatients();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPatients();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadPatients();
  }

  viewPatient(patientId: string): void {
    this.router.navigate([`${this.getBasePath()}/patients`, patientId]);
  }

  createPatient(): void {
    this.router.navigate([`${this.getBasePath()}/patients/create`]);
  }

  // ✅ Clean async/await with modal
  async deletePatient(patientId: string, patientName: string): Promise<void> {
    const result = await this.confirmModal.open({
      title: 'Delete Patient',
      message: `Are you sure you want to delete "${patientName}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!result.confirmed) return;

    this.patientService.deletePatient(patientId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Patient deleted successfully');
          this.loadPatients();
        }
      },
      error: (error) => {
        this.toastService.error(
          error.error?.message || 'Failed to delete patient'
        );
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN', 'OWNER']);
  }

  private getBasePath(): string {
    if (this.authService.hasRole(['ADMIN', 'OWNER'])) return '/admin';
    return '/receptionist';
  }
}