import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-3xl font-bold text-slate-900 mb-8">My Profile</h1>

          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            @if (loading) {
              <div class="p-8 text-center">
                <p class="text-slate-600">Loading...</p>
              </div>
            } @else if (user) {
              <div class="p-8">
                <!-- User Information -->
                <div class="mb-8">
                  <h2 class="text-xl font-semibold text-slate-900 mb-4">Account Information</h2>
                  <div class="grid md:grid-cols-2 gap-6">
                    <div>
                      <label class="text-sm text-slate-600">User ID</label>
                      <p class="font-semibold text-slate-900 mt-1">{{ user.userId }}</p>
                    </div>
                    <div>
                      <label class="text-sm text-slate-600">Email</label>
                      <p class="font-semibold text-slate-900 mt-1">{{ user.email }}</p>
                    </div>
                    <div>
                      <label class="text-sm text-slate-600">Roles</label>
                      <div class="flex flex-wrap gap-2 mt-1">
                        @for (role of user.roles; track role) {
                          <span
                            class="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-semibold rounded"
                          >
                            {{ role }}
                          </span>
                        }
                      </div>
                    </div>
                    <div>
                      <label class="text-sm text-slate-600">Account Status</label>
                      <p
                        [class]="user.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'"
                        class="font-semibold mt-1"
                      >
                        {{ user.status }}
                      </p>
                    </div>
                    @if (user.lastLoginAt) {
                      <div>
                        <label class="text-sm text-slate-600">Last Login</label>
                        <p class="font-semibold text-slate-900 mt-1">
                          {{ user.lastLoginAt | date: 'medium' }}
                        </p>
                      </div>
                    }
                    @if (user.createdAt) {
                      <div>
                        <label class="text-sm text-slate-600">Account Created</label>
                        <p class="font-semibold text-slate-900 mt-1">
                          {{ user.createdAt | date: 'medium' }}
                        </p>
                      </div>
                    }
                  </div>
                </div>

                <!-- Employee Information -->
                @if (employee) {
                  <div class="border-t border-slate-200 pt-8">
                    <h2 class="text-xl font-semibold text-slate-900 mb-4">Employee Information</h2>
                    <div class="grid md:grid-cols-2 gap-6">
                      <div>
                        <label class="text-sm text-slate-600">Employee Code</label>
                        <p class="font-semibold text-slate-900 mt-1">{{ employee.employeeCode }}</p>
                      </div>
                      <div>
                        <label class="text-sm text-slate-600">Name</label>
                        <p class="font-semibold text-slate-900 mt-1">{{ employee.name }}</p>
                      </div>
                      <div>
                        <label class="text-sm text-slate-600">Department</label>
                        <p class="font-semibold text-slate-900 mt-1">{{ employee.department }}</p>
                      </div>
                      <div>
                        <label class="text-sm text-slate-600">Designation</label>
                        <p class="font-semibold text-slate-900 mt-1">{{ employee.designation }}</p>
                      </div>
                      <div>
                        <label class="text-sm text-slate-600">Phone</label>
                        <p class="font-semibold text-slate-900 mt-1">{{ employee.phone }}</p>
                      </div>
                      <div>
                        <label class="text-sm text-slate-600">Email</label>
                        <p class="font-semibold text-slate-900 mt-1">{{ employee.email }}</p>
                      </div>
                      @if (employee.specialization) {
                        <div>
                          <label class="text-sm text-slate-600">Specialization</label>
                          <p class="font-semibold text-slate-900 mt-1">
                            {{ employee.specialization }}
                          </p>
                        </div>
                      }
                      @if (employee.consultationFee) {
                        <div>
                          <label class="text-sm text-slate-600">Consultation Fee</label>
                          <p class="font-semibold text-slate-900 mt-1">
                            ₹{{ employee.consultationFee }}
                          </p>
                        </div>
                      }
                      @if (employee.qualification && employee.qualification.length > 0) {
                        <div class="md:col-span-2">
                          <label class="text-sm text-slate-600">Qualifications</label>
                          <div class="flex flex-wrap gap-2 mt-1">
                            @for (qual of employee.qualification; track qual) {
                              <span class="px-3 py-1 bg-slate-100 text-slate-800 text-sm rounded">
                                {{ qual }}
                              </span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  user: any = null;
  employee: any = null;
  loading = true;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.authService.getMe().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user = response.data;
          this.employee = response.data.employee;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loading = false;
      },
    });
  }
}
