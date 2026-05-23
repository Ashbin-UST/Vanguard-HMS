import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // ── Change this to your deployed backend URL when going to production ──
  private baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // ── Auth ────────────────────────────────────────────────────────────────

  login(data: any) {
    // POST /api/auth/login
    return this.http.post(`${this.baseUrl}/api/auth/login`, data);
  }

  logout() {
    // POST /api/auth/logout  (backend expects the Bearer token via interceptor)
    return this.http.post(`${this.baseUrl}/api/auth/logout`, {});
  }

  forgotPassword(data: { email: string }) {
    // POST /api/auth/forgot-password
    return this.http.post(`${this.baseUrl}/api/auth/forgot-password`, data);
  }

  resetPassword(data: { resetToken: string; newPassword: string; confirmPassword: string }) {
    // POST /api/auth/reset-password
    return this.http.post(`${this.baseUrl}/api/auth/reset-password`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    // PUT /api/auth/change-password  (auth required — handled by interceptor)
    return this.http.put(`${this.baseUrl}/api/auth/change-password`, data);
  }

  // ── Registration ────────────────────────────────────────────────────────

  register(data: any) {
    // POST /api/register/register-request
    return this.http.post(`${this.baseUrl}/api/register/register-request`, data);
  }

  // ── Employee (self) ─────────────────────────────────────────────────────

  getProfile() {
    // GET /api/employee/profile  (auth required — interceptor attaches token)
    return this.http.get(`${this.baseUrl}/api/employee/profile`);
  }

  // ── Nodes (sidebar) ─────────────────────────────────────────────────────

  getMyNodes() {
    // GET /api/nodes/my-nodes  (auth required — returns nodes for the current employee's designation)
    return this.http.get(`${this.baseUrl}/api/nodes/my-nodes`);
  }

  createNode(data: { name: string; path: string; icon?: string; allowedDesignations: string[] }) {
    // POST /api/nodes/create-node  (ADMIN/OWNER only)
    return this.http.post(`${this.baseUrl}/api/nodes/create-node`, data);
  }

  updateNode(nodeId: string, data: { name?: string; path?: string; icon?: string; allowedDesignations?: string[] }) {
    // PUT /api/nodes/update-node/:nodeId  (ADMIN/OWNER only)
    return this.http.put(`${this.baseUrl}/api/nodes/update-node/${nodeId}`, data);
  }

  deleteNode(nodeId: string) {
    // DELETE /api/nodes/delete-node/:nodeId  (ADMIN/OWNER only)
    return this.http.delete(`${this.baseUrl}/api/nodes/delete-node/${nodeId}`);
  }

  // ── Admin — Employee Management ─────────────────────────────────────────

  getEmployees() {
    // GET /api/admin/employees  (auth + OWNER/ADMIN required)
    return this.http.get(`${this.baseUrl}/api/admin/employees`);
  }

  getPendingEmployees() {
    // GET /api/admin/pending-employees
    return this.http.get(`${this.baseUrl}/api/admin/pending-employees`);
  }

  approveEmployee(employeeCode: string) {
    // PUT /api/admin/approve-employee/:employeeCode
    return this.http.put(
      `${this.baseUrl}/api/admin/approve-employee/${employeeCode}`,
      {}
    );
  }

  rejectEmployee(employeeCode: string) {
    // PUT /api/admin/reject-employee/:employeeCode
    return this.http.put(
      `${this.baseUrl}/api/admin/reject-employee/${employeeCode}`,
      {}
    );
  }

  createEmployee(data: any) {
    // POST /api/admin/create-employee  (auth + OWNER/ADMIN required)
    return this.http.post(`${this.baseUrl}/api/admin/create-employee`, data);
  }

  deleteEmployee(employeeCode: string) {
    // DELETE /api/admin/delete-employee/:employeeCode  (auth + OWNER/ADMIN required)
    return this.http.delete(
      `${this.baseUrl}/api/admin/delete-employee/${employeeCode}`
    );
  }

  // ── Token helpers ───────────────────────────────────────────────────────

  getToken() {
    return localStorage.getItem('token');
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
