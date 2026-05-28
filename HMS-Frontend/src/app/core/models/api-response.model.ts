export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PendingApproval {
  userId: string;
  email: string;
  roles: string[];
  status: string;
  approvalStatus: string;
  employee: {
    employeeCode: string;
    name: string;
    designation: string;
    department: string;
    email: string;
    phone: string;
    specialization?: string;
  };
  createdAt: Date;
}