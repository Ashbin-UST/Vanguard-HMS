import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NavbarComponent } from './shared/ui/navbar/navbar';
import { ToastComponent } from './shared/ui/toast/toast';
import { ConfirmModalComponent } from './shared/ui/confirm-modal/confirm-modal';

/**
 * Root shell.
 *
 * The public navbar (Home / Login / Register) is shown only on public routes
 * — every /dashboard/* route ships its own sidebar via DashboardLayoutComponent,
 * and the auth + change-password screens are full-bleed cards. The toast
 * outlet and confirm-modal outlet are mounted globally here so any feature
 * component can trigger them.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    ToastComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  private router = inject(Router);

  // Routes that should NOT render the public navbar.
  private chromelessPrefixes = [
    '/dashboard',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/change-password',
  ];

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  showNavbar = computed(() => {
    const url = this.currentUrl();
    return !this.chromelessPrefixes.some((p) => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'));
  });
}
