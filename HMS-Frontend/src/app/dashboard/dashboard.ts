import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component,ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard{ 

   user: any;

  constructor(private http: HttpClient,private cdr:ChangeDetectorRef) {}

  ngOnInit() {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get('http://localhost:5000/api/auth/me', { headers })
      .subscribe({
        next: (res:any) => {
          this.user = res.profile;
          console.log(res);
          this.cdr.detectChanges();
        },
        error: (err:any) => {
          console.log(err);
        }
      });
    }

}
