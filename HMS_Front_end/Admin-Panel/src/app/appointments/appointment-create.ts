import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppointmentService } from '../services/appointment.service';
import { PatientService } from '../services/patient.service';
import { EmployeeService } from '../services/employee.service';
import { Appointment, CreateAppointmentRequest } from '../models/appointment.model';
import { Patient } from '../models/patient.model';
import { Employee } from '../models/user.model';

@Component({
    selector: 'app-appointment-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './appointment-create.html',
    styleUrl: './appointment-create.css',
})
export class AppointmentCreateComponent implements OnInit {
    appointmentForm: FormGroup;
    loading = false;
    error = '';
    isEditing = false;
    appointmentId: string | null = null;

    patients: Patient[] = [];
    doctors: Employee[] = [];
    availableSlots: string[] = [];

    constructor(
        private readonly fb: FormBuilder,
        private readonly appointmentService: AppointmentService,
        private readonly patientService: PatientService,
        private readonly employeeService: EmployeeService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {
        this.appointmentForm = this.fb.group({
            patientId: ['', Validators.required],
            doctorEmployeeId: ['', Validators.required],
            appointmentDate: ['', Validators.required],
            timeSlot: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.loadPatients();
        this.loadDoctors();

        this.route.paramMap.subscribe((params) => {
            const appointmentId = params.get('id');
            if (appointmentId) {
                this.isEditing = true;
                this.appointmentId = appointmentId;
                this.loadAppointment(appointmentId);
            }
        });

        this.appointmentForm.get('appointmentDate')?.valueChanges.subscribe(() => {
            this.getAvailableSlots();
        });

        this.appointmentForm.get('doctorEmployeeId')?.valueChanges.subscribe(() => {
            this.getAvailableSlots();
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

    loadDoctors(): void {
        this.employeeService.getDoctors().subscribe({
            next: (response: any) => {
                this.doctors = response.doctors || response || [];
            },
            error: (err: any) => {
                console.error('Error loading doctors:', err);
            },
        });
    }

    loadAppointment(id: string): void {
        this.loading = true;
        this.appointmentService.getAppointmentById(id).subscribe({
            next: (appointment: Appointment) => {
                this.appointmentForm.patchValue({
                    patientId: appointment.patientId,
                    doctorEmployeeId: appointment.doctorEmployeeId,
                    appointmentDate: new Date(appointment.appointmentDate)
                        .toISOString()
                        .split('T')[0],
                    timeSlot: appointment.timeSlot,
                });
                this.loading = false;
            },
            error: (err: any) => {
                this.error = err.error?.message || 'Failed to load appointment';
                this.loading = false;
            },
        });
    }

    getAvailableSlots(): void {
        const date = this.appointmentForm.get('appointmentDate')?.value;
        const doctorId = this.appointmentForm.get('doctorEmployeeId')?.value;

        if (!date || !doctorId) {
            return;
        }

        this.appointmentService
            .getAvailableSlots(doctorId, date)
            .subscribe({
                next: (response: any) => {
                    this.availableSlots = response.slots || [];
                },
                error: (err: any) => {
                    console.error('Error loading available slots:', err);
                },
            });
    }

    onSubmit(): void {
        if (this.appointmentForm.invalid) {
            alert('Please fill in all required fields');
            return;
        }

        this.loading = true;

        const formValue = this.appointmentForm.value;
        const appointmentData: CreateAppointmentRequest = {
            patientId: formValue.patientId,
            doctorEmployeeId: formValue.doctorEmployeeId,
            appointmentDate: new Date(formValue.appointmentDate),
            timeSlot: formValue.timeSlot,
        };

        if (this.isEditing && this.appointmentId) {
            this.appointmentService
                .updateAppointment(this.appointmentId, {
                    ...appointmentData,
                    status: 'BOOKED',
                })
                .subscribe({
                    next: () => {
                        alert('Appointment updated successfully');
                        this.router.navigate(['/appointments']);
                        this.loading = false;
                    },
                    error: (err: any) => {
                        this.error = err.error?.message || 'Failed to update appointment';
                        this.loading = false;
                    },
                });
        } else {
            this.appointmentService.createAppointment(appointmentData).subscribe({
                next: () => {
                    alert('Appointment created successfully');
                    this.router.navigate(['/appointments']);
                    this.loading = false;
                },
                error: (err: any) => {
                    this.error = err.error?.message || 'Failed to create appointment';
                    this.loading = false;
                },
            });
        }
    }

    cancel(): void {
        this.router.navigate(['/appointments']);
    }
}
