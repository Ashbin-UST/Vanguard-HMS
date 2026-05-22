import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicalRecordService } from '../services/medical-record.service';
import { MedicalRecord } from '../models/medical-record.model';

@Component({
  selector: 'app-medical-record-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './medical-record-list.html',
  styleUrl: './medical-record-list.css',
})
export class MedicalRecordListComponent implements OnInit {
  medicalRecords: MedicalRecord[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchQuery = '';

  constructor(
    private readonly medicalRecordService: MedicalRecordService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadMedicalRecords();
  }

  loadMedicalRecords(): void {
    this.loading = true;
    this.error = '';

    this.medicalRecordService
      .getMedicalRecords(this.currentPage, this.itemsPerPage)
      .subscribe({
        next: (response: any) => {
          this.medicalRecords = response.records || [];
          this.totalItems = response.total || 0;
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to load medical records';
          this.loading = false;
        },
      });
  }

  searchRecords(): void {
    if (!this.searchQuery.trim()) {
      this.loadMedicalRecords();
      return;
    }

    this.loading = true;
    this.medicalRecordService.searchMedicalRecords(this.searchQuery).subscribe({
      next: (response: any) => {
        this.medicalRecords = response.records || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Search failed';
        this.loading = false;
      },
    });
  }

  viewRecord(id: string): void {
    this.router.navigate(['/medical-records', id]);
  }

  editRecord(id: string): void {
    this.router.navigate(['/medical-records/edit', id]);
  }

  deleteRecord(id: string): void {
    if (confirm('Are you sure you want to delete this medical record?')) {
      this.medicalRecordService.deleteMedicalRecord(id).subscribe({
        next: () => {
          this.medicalRecords = this.medicalRecords.filter((r) => r._id !== id);
          alert('Medical record deleted successfully');
        },
        error: (err: any) => {
          alert(err.error?.message || 'Failed to delete record');
        },
      });
    }
  }

  createNewRecord(): void {
    this.router.navigate(['/medical-records/create']);
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
      this.loadMedicalRecords();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMedicalRecords();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
}
