import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginService } from '../service/login/login.service';
import { AuthService } from '../service/auth/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  ngOnInit(): void {
  
  }
  loginData = {
    "email": "",
    "password": ""
  }
// constructor ()
constructor(private loginService:LoginService,
  private authService:AuthService,private router: Router) { }
  onSubmit(){
    this.loginService.loginsubmit(this.loginData).subscribe((data:any) => {
      // Handle the retrieved data
      alert("Login successful!");
      alert("Token: " + data.token);
      alert("User: " + JSON.stringify(data.user));
      // alert("Roles: " + JSON.stringify(data.roles));
      // alert(JSON.stringify(data));
      // console.log(data);
      this.authService.setToken(data.token);
      this.authService.setUser(data.user);
      this.authService.setRole(data.user.roles);
      // alert(data.token);
      // alert("bababa");
      // alert(data.user);
      alert(data.user.roles);
      alert(this.authService.getRole());
      this.router.navigate(['/dashboard']);
    });
  }
}
