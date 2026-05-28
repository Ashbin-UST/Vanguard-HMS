import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-white shadow-md">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center space-x-2">
              <span class="text-2xl">🏥</span>
              <span class="text-xl font-bold text-primary-600">HMS</span>
            </a>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            @if (!currentUser) {
              <a routerLink="/" routerLinkActive="text-primary-600" [routerLinkActiveOptions]="{exact: true}"
                 class="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                Home
              </a>
              <a routerLink="/register" routerLinkActive="text-primary-600"
                 class="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                Register
              </a>
              <a routerLink="/login" routerLinkActive="text-primary-600"
                 class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Login
              </a>
            } @else {
              @if (isAdmin()) {
                <a routerLink="/admin/dashboard" routerLinkActive="text-primary-600"
                   class="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                  Dashboard
                </a>
              } @else {
                <a routerLink="/dashboard" routerLinkActive="text-primary-600"
                   class="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                  Dashboard
                </a>
              }
              <a routerLink="/profile" routerLinkActive="text-primary-600"
                 class="text-slate-700 hover:text-primary-600 font-medium transition-colors">
                Profile
              </a>
              
              <!-- User Menu -->
              <div class="relative">
                <button (click)="toggleUserMenu()" 
                        class="flex items-center space-x-2 text-slate-700 hover:text-primary-600">
                  <span class="font-medium">{{ currentUser.email }}</span>
                  <span class="text-xs">▼</span>
                </button>
                
                @if (userMenuOpen) {
                  <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div class="px-4 py-2 border-b border-slate-200">
                      <p class="text-xs text-slate-600">Signed in as</p>
                      <p class="text-sm font-semibold text-slate-900 truncate">{{ currentUser.email }}</p>
                    </div>
                    <button (click)="logout()" 
                            class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">
                      Logout
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Mobile Menu Button -->
          <button (click)="toggleMobileMenu()" class="md:hidden text-slate-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        @if (mobileMenuOpen) {
          <div class="md:hidden py-4 border-t border-slate-200">
            @if (!currentUser) {
              <a routerLink="/" (click)="closeMobileMenu()"
                 class="block py-2 text-slate-700 hover:text-primary-600">
                Home
              </a>
              <a routerLink="/register" (click)="closeMobileMenu()"
                 class="block py-2 text-slate-700 hover:text-primary-600">
                Register
              </a>
              <a routerLink="/login" (click)="closeMobileMenu()"
                 class="block py-2 text-slate-700 hover:text-primary-600">
                Login
              </a>
            } @else {
              @if (isAdmin()) {
                <a routerLink="/admin/dashboard" (click)="closeMobileMenu()"
                   class="block py-2 text-slate-700 hover:text-primary-600">
                  Dashboard
                </a>
              } @else {
                <a routerLink="/dashboard" (click)="closeMobileMenu()"
                   class="block py-2 text-slate-700 hover:text-primary-600">
                  Dashboard
                </a>
              }
              <a routerLink="/profile" (click)="closeMobileMenu()"
                 class="block py-2 text-slate-700 hover:text-primary-600">
                Profile
              </a>
              <button (click)="logout()" 
                      class="block w-full text-left py-2 text-red-600">
                Logout
              </button>
            }
          </div>
        }
      </div>
    </nav>
  `
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;
  userMenuOpen = false;
  mobileMenuOpen = false;

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN', 'OWNER']);
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.userMenuOpen = false;
    this.mobileMenuOpen = false;
  }
}