import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  user: any = null;
  employee: any = null;
  loading = true;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.authService.getMe().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.user = response.data;
          this.employee = response.data.employee;
        }
        console.log(response.data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loading = false;
      }
    });
  }
}