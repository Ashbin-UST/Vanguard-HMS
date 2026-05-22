import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../services/billing.service';
import { Bill } from '../models/bill.model';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './billing-list.html',
  styleUrl: './billing-list.css',
})
export class BillingListComponent implements OnInit {
  bills: Bill[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  searchQuery = '';
  filterStatus = '';

  statusOptions = ['PENDING', 'PAID', 'PARTIAL'];
  totalRevenue = 0;

  constructor(
    private readonly billingService: BillingService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    this.error = '';

    this.billingService.getBills(this.currentPage, this.itemsPerPage).subscribe({
      next: (response: any) => {
        let bills = response.bills || [];

        if (this.filterStatus) {
          bills = bills.filter((b: Bill) => b.status === this.filterStatus);
        }

        this.bills = bills;
        this.totalItems = response.total || 0;
        this.calculateTotalRevenue();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load bills';
        this.loading = false;
      },
    });
  }

  calculateTotalRevenue(): void {
    this.totalRevenue = this.bills.reduce((sum, bill) => {
      const amount = typeof bill.total === 'string' ? Number.parseFloat(bill.total) : bill.total;
      return sum + (bill.status === 'PAID' ? amount : 0);
    }, 0);
  }

  filterByStatus(): void {
    this.currentPage = 1;
    this.loadBills();
  }

  viewBill(id: string): void {
    this.router.navigate(['/billing', id]);
  }

  editBill(id: string): void {
    this.router.navigate(['/billing/edit', id]);
  }

  markAsPaid(id: string): void {
    this.billingService.markAsPaid(id).subscribe({
      next: () => {
        this.loadBills();
        alert('Bill marked as paid');
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to update bill');
      },
    });
  }

  deleteBill(id: string): void {
    if (confirm('Are you sure you want to delete this bill?')) {
      this.billingService.deleteBill(id).subscribe({
        next: () => {
          this.bills = this.bills.filter((b) => b._id !== id);
          alert('Bill deleted successfully');
        },
        error: (err: any) => {
          alert(err.error?.message || 'Failed to delete bill');
        },
      });
    }
  }

  createNewBill(): void {
    this.router.navigate(['/billing/create']);
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
      this.loadBills();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBills();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID':
        return 'status-paid';
      case 'PENDING':
        return 'status-pending';
      case 'PARTIAL':
        return 'status-partial';
      default:
        return '';
    }
  }
}
