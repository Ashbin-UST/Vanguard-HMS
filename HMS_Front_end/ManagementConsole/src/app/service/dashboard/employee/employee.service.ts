import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';
import { NewEmployee } from '../../../dash/models/newEmployee.model';
import { Employee } from '../../../dash/models/employee.model';
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
 private api="http://localhost:5000/api/auth/employees/employee"


 

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    console.log("Fetching employees from API...");
    return this.http.get<Employee[]>(this.api)
  }

  addEmployee(emp: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.api, emp);
  }

  deleteEmployee(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  
}
