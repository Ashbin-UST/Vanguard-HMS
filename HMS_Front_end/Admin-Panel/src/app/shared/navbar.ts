import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit {
  @Input() isLoggedIn = false;
  @Input() currentUser: any = null;
  @Output() logout = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();

  showMenu = false;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {}

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  onLogout(): void {
    this.logout.emit();
  }

  onNavigate(route: string): void {
    this.navigate.emit(route);
    this.showMenu = false;
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
