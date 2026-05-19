import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
export const routes: Routes = [
    {path: '', component:Home},
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
    {path:'dashboard', component:Dashboard}
];
