import { Routes } from '@angular/router';
import {Login} from "./login/login";
import { Signup } from './signup/signup'; 
import { User } from './user/user';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
    {path:'signup',component:Signup},
    {path:'',component:Login},
    {path:'dashboard',component:Dashboard},
    

];
