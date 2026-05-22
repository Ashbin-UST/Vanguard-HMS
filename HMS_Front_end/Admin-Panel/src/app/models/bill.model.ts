export interface Bill {
  _id?: string;
  billId: string;
  patientId: string;
  appointmentId?: string;
  items: BillItem[];
  total: string | number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  createdByEmployeeId: string;
  created_at?: Date;
  updated_at?: Date;
  patient?: {
    name: string;
    UHID: string;
    email: string;
  };
  appointment?: {
    appointmentId: string;
    appointmentDate: Date;
  };
}

export interface BillItem {
  serviceName: string;
  amount: number;
}

export interface CreateBillRequest {
  patientId: string;
  appointmentId?: string;
  items: BillItem[];
  status?: 'PENDING' | 'PAID' | 'PARTIAL';
}

export interface UpdateBillRequest {
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  items?: BillItem[];
  total?: number;
}

export interface Payment {
  _id?: string;
  billId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at?: Date;
  updated_at?: Date;
}
