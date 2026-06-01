import {
  Component,
  HostListener,
  OnInit,
  signal,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';

// Viewport width (px) below which we treat the device as "mobile": the sidebar
// becomes an overlay that is hidden by default and toggled via the hamburger.
const MOBILE_BREAKPOINT = 768;

/**
 * Dashboard shell: a collapsible sidebar on the left, a sticky top bar with a
 * hamburger toggle and the current page title, and a projected content area.
 *
 * Responsiveness:
 *   - Desktop (>= 768px): the sidebar is docked and visible by default; the
 *     content is offset to the right of it.
 *   - Mobile (< 768px): the sidebar is hidden by default and slides in as an
 *     overlay (with a dimmed backdrop) when the hamburger is tapped. The
 *     content is full-width and never covered by the sidebar.
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayoutComponent implements OnInit {
  @Input() pageTitle = '';

  // Whether the viewport is currently mobile-sized.
  isMobile = signal(false);

  // Whether the sidebar is currently shown. Default: hidden on mobile, shown
  // on desktop. Recomputed on resize.
  sidebarOpen = signal(true);

  ngOnInit(): void {
    this.applyViewport();
  }

  // Keep the layout in sync when the window is resized or the device rotates.
  @HostListener('window:resize')
  onResize(): void {
    this.applyViewport();
  }

  private applyViewport(): void {
    const mobile = globalThis.window !== undefined && window.innerWidth < MOBILE_BREAKPOINT;
    this.isMobile.set(mobile);
    // Hidden by default on mobile, visible by default on desktop.
    this.sidebarOpen.set(!mobile);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  // Close the sidebar (used by the backdrop and after navigating on mobile).
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  // After tapping a nav link on mobile, collapse the overlay.
  onSidebarNavigate(): void {
    if (this.isMobile()) {
      this.closeSidebar();
    }
  }
}