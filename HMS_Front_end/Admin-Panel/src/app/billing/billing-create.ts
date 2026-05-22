import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BillingService } from '../services/billing.service';
import { PatientService } from '../services/patient.service';
import { AppointmentService } from '../services/appointment.service';
import { Bill, CreateBillRequest, BillItem } from '../models/bill.model';

@Component({
    selector: 'app-billing-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CurrencyPipe],
    templateUrl: './billing-create.html',
    styleUrl: './billing-create.css',
})
export class BillingCreateComponent implements OnInit {
    billForm: FormGroup;
    loading = false;
    error = '';
    isEditing = false;
    billId: string | null = null;

    patients: any[] = [];
    appointments: any[] = [];
    totalAmount = 0;
    statusOptions = ['PENDING', 'PAID', 'PARTIAL'];

    constructor(
        private readonly fb: FormBuilder,
        private readonly billingService: BillingService,
        private readonly patientService: PatientService,
        private readonly appointmentService: AppointmentService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {
        this.billForm = this.fb.group({
            patientId: ['', Validators.required],
            appointmentId: [''],
            items: this.fb.array([this.createBillItem()]),
            status: ['PENDING', Validators.required],
        });
    }

    ngOnInit(): void {
        this.loadPatients();
        this.loadAppointments();

        this.route.paramMap.subscribe((params) => {
            const billId = params.get('id');
            if (billId) {
                this.isEditing = true;
                this.billId = billId;
                this.loadBill(billId);
            }
        });

        this.items.valueChanges.subscribe(() => {
            this.calculateTotal();
        });
    }

    loadPatients(): void {
        this.patientService.getPatients().subscribe({
            next: (response: any) => {
                this.patients = response.patients || [];
            },
            error: (err: any) => {
                console.error('Error loading patients:', err);
            },
        });
    }

    loadAppointments(): void {
        this.appointmentService.getAppointments().subscribe({
            next: (response: any) => {
                this.appointments = response.appointments || [];
            },
            error: (err: any) => {
                console.error('Error loading appointments:', err);
            },
        });
    }

    loadBill(id: string): void {
        this.loading = true;
        this.billingService.getBillById(id).subscribe({
            next: (bill: Bill) => {
                this.billForm.patchValue({
                    patientId: bill.patientId,
                    appointmentId: bill.appointmentId,
                    status: bill.status,
                });

                const itemsArray = this.billForm.get('items') as FormArray;
                itemsArray.clear();

                bill.items.forEach((item) => {
                    itemsArray.push(
                        this.fb.group({
                            serviceName: [item.serviceName, Validators.required],
                            amount: [item.amount, [Validators.required, Validators.min(0)]],
                        })
                    );
                });

                this.calculateTotal();
                this.loading = false;
            },
            error: (err: any) => {
                this.error = err.error?.message || 'Failed to load bill';
                this.loading = false;
            },
        });
    }

    createBillItem(): FormGroup {
        return this.fb.group({
            serviceName: ['', Validators.required],
            amount: ['', [Validators.required, Validators.min(0)]],
        });
    }

    get items(): FormArray {
        return this.billForm.get('items') as FormArray;
    }

    addItem(): void {
        this.items.push(this.createBillItem());
    }

    removeItem(index: number): void {
        this.items.removeAt(index);
    }

    calculateTotal(): void {
        this.totalAmount = this.items.value.reduce((sum: number, item: BillItem) => {
            return sum + (item.amount || 0);
        }, 0);
    }

    onSubmit(): void {
        if (this.billForm.invalid || this.items.length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        this.loading = true;

        const formValue = this.billForm.value;
        const billData: CreateBillRequest = {
            patientId: formValue.patientId,
            appointmentId: formValue.appointmentId,
            items: formValue.items,
            status: formValue.status ?? 'PENDING',
        };

        if (this.isEditing && this.billId) {

            const updateBillData = {
                patientId: billData.patientId,
                appointmentId: billData.appointmentId,
                items: billData.items,
                status: billData.status ?? 'PENDING',
                total: this.totalAmount,
            };

            this.billingService.updateBill(this.billId, updateBillData).subscribe({
                next: () => {
                    alert('Bill updated successfully');
                    this.router.navigate(['/billing']);
                    this.loading = false;
                },
                error: (err: any) => {
                    this.error = err.error?.message || 'Failed to update bill';
                    this.loading = false;
                },
            });

        } else {
            this.billingService.createBill(billData).subscribe({
                next: () => {
                    alert('Bill created successfully');
                    this.router.navigate(['/billing']);
                    this.loading = false;
                },
                error: (err: any) => {
                    this.error = err.error?.message || 'Failed to create bill';
                    this.loading = false;
                },
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/billing']);
    }
}
