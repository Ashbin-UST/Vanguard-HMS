import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // --- Public Routes ---
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },

  // --- Admin Routes ---
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/dashboard/admin/admin').then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/approvals',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-approvals/admin-approvals').then(
        (m) => m.AdminApprovalsComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },

  {
    path: 'admin/employees/create',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-create-employee/admin-create-employee').then(
        (m) => m.AdminCreateEmployeeComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/patients',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-patients/admin-patients').then(
        (m) => m.AdminPatientsComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/patients/create',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-patient-create/admin-patient-create').then(
        (m) => m.AdminPatientCreateComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/patients/:id',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-patient-detail/admin-patient-detail').then(
        (m) => m.AdminPatientDetailComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/appointments',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-appointments/admin-appointments').then(
        (m) => m.AdminAppointmentsComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/appointments/today',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-appointments-today/admin-appointments-today').then(
        (m) => m.AdminAppointmentsTodayComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/book-appointment',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-book-appointment/admin-book-appointment').then(
        (m) => m.AdminBookAppointmentComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/appointments/:id',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-appointment-detail/admin-appointment-detail').then(
        (m) => m.AdminAppointmentDetailComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/appointments/:id/notes',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-appointment-notes/admin-appointment-notes').then(
        (m) => m.AdminAppointmentNotesComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/profile',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-profile/admin-profile').then(
        (m) => m.AdminProfileComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },

  // IMPORTANT: /admin/employees/edit/:id MUST come BEFORE /admin/employees/:id
  // so Angular matches the more-specific route first.
  {
    path: 'admin/employees/edit/:id',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-employee-edit/admin-employee-edit').then(
        (m) => m.AdminEmployeeEditComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },
  {
    path: 'admin/employees',
    loadComponent: () =>
      import('./features/dashboard/admin/admin-employee-list/admin-employee-list').then(
        (m) => m.AdminEmployeeListComponent,
      ),
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
  },

  // --- Receptionist Routes ---
  {
    path: 'receptionist/dashboard',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist').then(
        (m) => m.ReceptionistDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/patients',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-patients').then(
        (m) => m.ReceptionistPatientsComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/patients/create',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-patient-create').then(
        (m) => m.ReceptionistPatientCreateComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/patients/search',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-patients').then(
        (m) => m.ReceptionistPatientsComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/patients/:id',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-patient-detail').then(
        (m) => m.ReceptionistPatientDetailComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/appointments',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-appointments').then(
        (m) => m.ReceptionistAppointmentsComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/appointments/today',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-appointments-today').then(
        (m) => m.ReceptionistAppointmentsTodayComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/book-appointment',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-book-appointment').then(
        (m) => m.ReceptionistBookAppointmentComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/appointments/:id',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-appointment-detail').then(
        (m) => m.ReceptionistAppointmentDetailComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },
  {
    path: 'receptionist/profile',
    loadComponent: () =>
      import('./features/dashboard/receptionist/receptionist-profile').then(
        (m) => m.ReceptionistProfileComponent,
      ),
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
  },

  // --- Doctor Routes ---
  {
    path: 'doctor/dashboard',
    loadComponent: () =>
      import('./features/dashboard/doctor/doctor').then((m) => m.DoctorDashboardComponent),
    canActivate: [authGuard, roleGuard(['DOCTOR'])],
  },
  {
    path: 'doctor/appointments',
    loadComponent: () =>
      import('./features/dashboard/doctor/doctor').then((m) => m.DoctorDashboardComponent),
    canActivate: [authGuard, roleGuard(['DOCTOR'])],
  },
  {
    path: 'doctor/appointments/:id',
    loadComponent: () =>
      import('./features/dashboard/doctor/doctor-appointment-detail').then(
        (m) => m.DoctorAppointmentDetailComponent,
      ),
    canActivate: [authGuard, roleGuard(['DOCTOR'])],
  },
  {
    path: 'doctor/appointments/:id/notes',
    loadComponent: () =>
      import('./features/dashboard/doctor/doctor-appointment-notes').then(
        (m) => m.DoctorAppointmentNotesComponent,
      ),
    canActivate: [authGuard, roleGuard(['DOCTOR'])],
  },
  {
    path: 'doctor/profile',
    loadComponent: () =>
      import('./features/dashboard/doctor/doctor-profile').then((m) => m.DoctorProfileComponent),
    canActivate: [authGuard, roleGuard(['DOCTOR'])],
  },

  // --- Fallback ---
  { path: 'dashboard', redirectTo: 'doctor/dashboard', pathMatch: 'full' },
  { path: 'profile', redirectTo: 'admin/profile', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];