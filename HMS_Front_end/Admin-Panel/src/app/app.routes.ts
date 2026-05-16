import { Routes } from '@angular/router';
import { Login } from "./login/login";
import { Signup } from './signup/signup';

export const routes: Routes = [
    { path: 'signup', component: Signup },
    { path: 'login', component: Login }
];