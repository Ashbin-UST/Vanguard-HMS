import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';

/**
 * Dashboard shell: fixed dynamic sidebar on the left, a sticky top bar with the
 * current page title, and a projected content area. The sidebar loads its own
 * nodes, so this layout only needs the page title.
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayoutComponent {
  @Input() pageTitle = '';
}
