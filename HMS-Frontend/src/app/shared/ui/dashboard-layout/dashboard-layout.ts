import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';
import { SidebarItem } from '../../../core/models/user.model';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayoutComponent {
  @Input() menuItems: SidebarItem[] = [];
  @Input() title: string = 'HMS';
  @Input() subtitle: string = '';
  @Input() pageTitle: string = '';
}