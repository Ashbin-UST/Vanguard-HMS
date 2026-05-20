import { Component,Injectable } from '@angular/core';
import  { SignupService } from '../service/signup/signup.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  registrationData = {
    
  "username": "",
 
  "email": "",
 
  "password": "",
 
  "roles": [""],
 
  "name": "",
 
  "phone": "",
 
  "department": "",
 
  "designation": "",
 
  "joiningDate": "",
 
  "qualification": [
    ]

  };
  constructor(private signupService:SignupService) { }
  onSubmit(){
    this.signupService.signupsubmit(this.registrationData).subscribe(
   
    );

}}
