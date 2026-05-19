import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  user: any;

  constructor(private readonly http: HttpClient, private readonly cdr: ChangeDetectorRef, private readonly router: Router) { }

  ngOnInit() {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get('http://localhost:5000/api/auth/profile', { headers })
      .subscribe({
        next: (res: any) => {
          console.log(res);
          this.user = res.employee;
          console.log(res);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.log(err);
        }
      });
  }

  onLogout(): void {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    this.router.navigate(['']);
  }

}