import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarItem } from '../../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() menuItems: SidebarItem[] = [];
  @Input() title: string = 'HMS';
  @Input() subtitle: string = '';

  currentUser = this.authService.getCurrentUser();

  logout(): void {
    this.authService.logout();
  }

  getUserInitial(): string {
    return this.currentUser?.email?.charAt(0)?.toUpperCase() || 'U';
  }
}