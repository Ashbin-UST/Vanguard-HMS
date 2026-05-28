import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardLayoutComponent } from '../../../../shared/ui/dashboard-layout/dashboard-layout';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmModalService } from '../../../../core/services/confirm-modal.service';
import { PendingApproval } from '../../../../core/models/api-response.model';
import { ADMIN_SIDEBAR } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule, DashboardLayoutComponent],
  templateUrl: './admin-approvals.html',
  styleUrl: './admin-approvals.scss'
})
export class AdminApprovalsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private confirmModal = inject(ConfirmModalService);

  sidebarItems = ADMIN_SIDEBAR;
  pendingApprovals: PendingApproval[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.loading = true;
    this.adminService.getPendingApprovals().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pendingApprovals = response.data;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // Replaced confirm + alert with modal + toast
  async approve(userId: string): Promise<void> {
    const result = await this.confirmModal.open({
      title: 'Approve Employee',
      message: 'Are you sure you want to approve this employee registration?',
      confirmText: 'Yes, Approve',
      cancelText: 'Cancel',
      type: 'success'
    });

    if (!result.confirmed) return;

    this.adminService.approveEmployee(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Employee approved successfully!');
          this.loadPendingApprovals();
        }
      },
      error: (error) => {
        this.toastService.error(
          error.error?.message || 'Failed to approve employee'
        );
      }
    });
  }

  // Replaced prompt + alert with modal (with input) + toast
  async reject(userId: string): Promise<void> {
    const result = await this.confirmModal.open({
      title: 'Reject Employee',
      message: 'Are you sure you want to reject this employee registration?',
      confirmText: 'Yes, Reject',
      cancelText: 'Cancel',
      type: 'danger',
      showInput: true,
      inputLabel: 'Reason for rejection (optional)',
      inputPlaceholder: 'e.g. Incomplete documents...'
    });

    if (!result.confirmed) return;

    this.adminService.rejectEmployee(
      userId,
      result.inputValue?.trim() || undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Employee rejected successfully!');
          this.loadPendingApprovals();
        }
      },
      error: (error) => {
        this.toastService.error(
          error.error?.message || 'Failed to reject employee'
        );
      }
    });
  }
}