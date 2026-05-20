import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';
import { SignupComponent } from './signup/signup.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' }, 
    {path:'login', component: LoginComponent},
    {path:'users', component: UserComponent},
    {path:'signup', component: SignupComponent},
    {path:'dashboard', component: DashboardComponent}

];
