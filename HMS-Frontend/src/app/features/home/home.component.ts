import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <!-- Hero Section -->
      <section class="container mx-auto px-4 py-20">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Welcome to <span class="text-primary-600">Hospital Management System</span>
          </h1>
          <p class="text-xl text-slate-600 mb-12">
            Streamline your healthcare operations with our comprehensive management platform.
            Manage patients, staff, appointments, and more with ease.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/register" 
               class="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg">
              Register as Employee
            </a>
            <a routerLink="/login" 
               class="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
              Login
            </a>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="container mx-auto px-4 py-20">
        <h2 class="text-3xl font-bold text-center text-slate-900 mb-12">
          Key Features
        </h2>
        
        <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div class="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span class="text-2xl">👥</span>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-3">Staff Management</h3>
            <p class="text-slate-600">
              Efficiently manage doctors, nurses, and all hospital staff with role-based access control.
            </p>
          </div>

          <div class="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <span class="text-2xl">📅</span>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-3">Appointment System</h3>
            <p class="text-slate-600">
              Schedule and manage patient appointments with automated reminders and notifications.
            </p>
          </div>

          <div class="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div class="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <span class="text-2xl">🔒</span>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-3">Secure Access</h3>
            <p class="text-slate-600">
              Advanced security with admin approval workflow and role-based permissions.
            </p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="bg-primary-600 py-16">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p class="text-primary-100 mb-8 text-lg">
            Register now and experience seamless hospital management.
          </p>
          <a routerLink="/register" 
             class="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors shadow-lg">
            Register Now
          </a>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent {}