import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  features = [
    {
      icon: '👥',
      iconBg: 'icon-bg--primary',
      title: 'Staff Management',
      description: 'Efficiently manage doctors, nurses, and all hospital staff with role-based access control.'
    },
    {
      icon: '📅',
      iconBg: 'icon-bg--secondary',
      title: 'Appointment System',
      description: 'Schedule and manage patient appointments with automated reminders and notifications.'
    },
    {
      icon: '🔒',
      iconBg: 'icon-bg--accent',
      title: 'Secure Access',
      description: 'Advanced security with admin approval workflow and role-based permissions.'
    }
  ];
}