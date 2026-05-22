import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../services/patient.service';
import { Patient } from '../models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css',
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchQuery = '';

  constructor(
    private readonly patientService: PatientService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.error = '';

    this.patientService
      .getPatients(this.currentPage, this.itemsPerPage)
      .subscribe({
        next: (response: any) => {
          this.patients = response.patients || [];
          this.totalItems = response.total || 0;
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to load patients';
          this.loading = false;
          console.error('Error loading patients:', err);
        },
      });
  }

  searchPatients(): void {
    if (!this.searchQuery.trim()) {
      this.loadPatients();
      return;
    }

    this.loading = true;
    this.patientService.searchPatients(this.searchQuery).subscribe({
      next: (response: any) => {
        this.patients = response.patients || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Search failed';
        this.loading = false;
      },
    });
  }

  viewPatient(id: string): void {
    this.router.navigate(['/patients', id]);
  }

  editPatient(id: string): void {
    this.router.navigate(['/patients/edit', id]);
  }

  deletePatient(id: string): void {
    if (confirm('Are you sure you want to delete this patient?')) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.patients = this.patients.filter((p) => p._id !== id);
          alert('Patient deleted successfully');
        },
        error: (err: any) => {
          alert(err.error?.message || 'Failed to delete patient');
        },
      });
    }
  }

  createNewPatient(): void {
    this.router.navigate(['/patients/create']);
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
      this.loadPatients();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPatients();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
}
