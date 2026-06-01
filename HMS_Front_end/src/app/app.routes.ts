import { Routes, CanActivateFn, Router } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { designationGuard } from './core/guards/role.guard';
import { mustChangePasswordGuard } from './core/guards/must-change-password.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

/**
 * Application routes.
 *
 * Public routes: /, /login, /register, /forgot-password, /reset-password.
 *
 * Authenticated, password-change gate: /change-password (authGuard only — we
 * deliberately do NOT apply mustChangePasswordGuard here, that would loop).
 *
 * Authenticated dashboard tree: every /dashboard/* route runs through
 * authGuard + mustChangePasswordGuard, plus designationGuard where access is
 * limited. OWNER and ADMIN are superusers (handled inside the guard) and pass
 * every designation check. Forms that should warn on unsaved changes use
 * unsavedChangesGuard via canDeactivate.
 */
export const routes: Routes = [
  // --- Public routes ------------------------------------------------------
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(
        (m) => m.RegisterComponent,
      ),
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
      import('./features/auth/reset-password/reset-password').then(
        (m) => m.ResetPasswordComponent,
      ),
  },

  // --- Authenticated, gated change-password ------------------------------
  // Reachable both voluntarily and as the forced first-login destination.
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/change-password/change-password').then(
        (m) => m.ChangePasswordComponent,
      ),
  },

  // --- Dashboard tree -----------------------------------------------------
  {
    path: 'dashboard',
    canActivate: [authGuard, mustChangePasswordGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },

      // Available to every authenticated user (defaults rendered by sidebar).
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/dashboard/overview/overview').then(
            (m) => m.OverviewComponent,
          ),
      },
      {
        path: 'profile',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/dashboard/profile/profile').then(
            (m) => m.ProfileComponent,
          ),
      },

      // Employees: OWNER + ADMIN (superusers always pass)
      {
        path: 'employees',
        canActivate: [designationGuard([])], // empty list → only superusers
        loadComponent: () =>
          import('./features/dashboard/employees/employees').then(
            (m) => m.EmployeesListComponent,
          ),
      },
      {
        path: 'employees/create',
        canActivate: [designationGuard([])],
        canDeactivate: [unsavedChangesGuard],
        data: { mode: 'staff' },
        loadComponent: () =>
          import(
            './features/dashboard/employees-create/employees-create'
          ).then((m) => m.CreateEmployeeComponent),
      },

      // Approvals: OWNER + ADMIN
      {
        path: 'approvals',
        canActivate: [designationGuard([])],
        loadComponent: () =>
          import('./features/dashboard/approvals/approvals').then(
            (m) => m.ApprovalsComponent,
          ),
      },

      // Admins management: OWNER only (ADMIN does NOT pass — only OWNER)
      // The designationGuard does NOT have a built-in "only OWNER" mode,
      // because its superuser bypass treats both OWNER and ADMIN equally.
      // For the OWNER-exclusive tree we use the dedicated guard below.
      {
        path: 'admins',
        canActivate: [ownerOnlyGuard()],
        loadComponent: () =>
          import('./features/dashboard/admins/admins').then(
            (m) => m.AdminsComponent,
          ),
      },
      {
        path: 'admins/create',
        canActivate: [ownerOnlyGuard()],
        canDeactivate: [unsavedChangesGuard],
        data: { mode: 'admin' },
        loadComponent: () =>
          import(
            './features/dashboard/employees-create/employees-create'
          ).then((m) => m.CreateEmployeeComponent),
      },

      // Patients: OWNER + ADMIN + RECEPTIONIST
      {
        path: 'patients',
        canActivate: [designationGuard(['RECEPTIONIST'])],
        loadComponent: () =>
          import('./features/dashboard/patients-list/patients-list').then(
            (m) => m.PatientsListComponent,
          ),
      },
      {
        path: 'patients/create',
        canActivate: [designationGuard(['RECEPTIONIST'])],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/dashboard/patient-create/patient-create').then(
            (m) => m.PatientCreateComponent,
          ),
      },
      {
        path: 'patients/:UHID',
        canActivate: [designationGuard(['RECEPTIONIST'])],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/dashboard/patient-detail/patient-detail').then(
            (m) => m.PatientDetailComponent,
          ),
      },

      // Appointments: OWNER + ADMIN + RECEPTIONIST + DOCTOR
      // (Doctors auto-scoped to their own via /appointments/my in the list)
      {
        path: 'appointments',
        canActivate: [designationGuard(['RECEPTIONIST', 'DOCTOR'])],
        loadComponent: () =>
          import(
            './features/dashboard/appointments-list/appointments-list'
          ).then((m) => m.AppointmentsListComponent),
      },
      {
        path: 'appointments/book',
        canActivate: [designationGuard(['RECEPTIONIST'])],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import(
            './features/dashboard/appointment-book/appointment-book'
          ).then((m) => m.AppointmentBookComponent),
      },
      {
        path: 'appointments/:appointmentId',
        canActivate: [designationGuard(['RECEPTIONIST', 'DOCTOR'])],
        loadComponent: () =>
          import(
            './features/dashboard/appointment-detail/appointment-detail'
          ).then((m) => m.AppointmentDetailComponent),
      },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];

// --- Local OWNER-only guard (defined here to keep all routing in one file) ---
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';

function ownerOnlyGuard(): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (authService.getDesignation() === 'OWNER') {
      return true;
    }

    // Authenticated but not OWNER → bounce to overview.
    return router.createUrlTree(['/dashboard/overview']);
  };
}
