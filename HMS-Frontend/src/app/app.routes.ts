import { Routes } from '@angular/router';
import {Login} from "./login/login";
import { Signup } from './signup/signup'; 
import { User } from './user/user';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'dashboard', component: Dashboard }
];
