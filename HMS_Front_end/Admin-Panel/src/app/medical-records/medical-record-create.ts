import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MedicalRecordService } from '../services/medical-record.service';
import { AppointmentService } from '../services/appointment.service';
import { EmployeeService } from '../services/employee.service';
import { MedicalRecord, CreateMedicalRecordRequest, PrescriptionItem } from '../models/medical-record.model';

@Component({
  selector: 'app-medical-record-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './medical-record-create.html',
  styleUrl: './medical-record-create.css',
})
export class MedicalRecordCreateComponent implements OnInit {
  recordForm: FormGroup;
  loading = false;
  error = '';
  isEditing = false;
  recordId: string | null = null;

  appointments: any[] = [];
  doctors: any[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly medicalRecordService: MedicalRecordService,
    private readonly appointmentService: AppointmentService,
    private readonly employeeService: EmployeeService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.recordForm = this.fb.group({
      appointmentId: ['', Validators.required],
      patientId: [{ value: '', disabled: true }, Validators.required],
      doctorEmployeeId: ['', Validators.required],
      symptoms: ['', [Validators.required, Validators.minLength(10)]],
      diagnosis: ['', [Validators.required, Validators.minLength(10)]],
      prescriptionItems: this.fb.array([this.createPrescriptionItem()]),
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();

    this.route.paramMap.subscribe((params) => {
      const recordId = params.get('id');
      if (recordId) {
        this.isEditing = true;
        this.recordId = recordId;
        this.loadRecord(recordId);
      }
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

  loadRecord(id: string): void {
    this.loading = true;
    this.medicalRecordService.getMedicalRecordById(id).subscribe({
      next: (record: MedicalRecord) => {
        this.recordForm.patchValue({
          appointmentId: record.appointmentId,
          patientId: record.patientId,
          doctorEmployeeId: record.doctorEmployeeId,
          symptoms: record.symptoms,
          diagnosis: record.diagnosis,
          notes: record.notes,
        });

        const prescriptionsArray = this.recordForm.get('prescriptionItems') as FormArray;
        prescriptionsArray.clear();

        record.prescriptionItems.forEach((item) => {
          prescriptionsArray.push(
            this.fb.group({
              name: [item.name, Validators.required],
              dosage: [item.dosage, Validators.required],
              duration: [item.duration, Validators.required],
            })
          );
        });

        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load record';
        this.loading = false;
      },
    });
  }

  createPrescriptionItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      dosage: ['', Validators.required],
      duration: ['', Validators.required],
    });
  }

  get prescriptions(): FormArray {
    return this.recordForm.get('prescriptionItems') as FormArray;
  }

  addPrescription(): void {
    this.prescriptions.push(this.createPrescriptionItem());
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  onSubmit(): void {
    if (this.recordForm.invalid) {
      alert('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;

    const formValue = this.recordForm.getRawValue();
    const recordData: CreateMedicalRecordRequest = {
      appointmentId: formValue.appointmentId,
      patientId: formValue.patientId,
      doctorEmployeeId: formValue.doctorEmployeeId,
      symptoms: formValue.symptoms,
      diagnosis: formValue.diagnosis,
      prescriptionItems: formValue.prescriptionItems,
      notes: formValue.notes,
    };

    if (this.isEditing && this.recordId) {
      this.medicalRecordService.updateMedicalRecord(this.recordId, recordData).subscribe({
        next: () => {
          alert('Medical record updated successfully');
          this.router.navigate(['/medical-records']);
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to update record';
          this.loading = false;
        },
      });
    } else {
      this.medicalRecordService.createMedicalRecord(recordData).subscribe({
        next: () => {
          alert('Medical record created successfully');
          this.router.navigate(['/medical-records']);
          this.loading = false;
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to create record';
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/medical-records']);
  }
}
