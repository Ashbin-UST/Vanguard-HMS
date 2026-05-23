export interface Request {
  _id: string;
  requestedBy: string;
  requestorRole: string;
  name: string;
  role: string;
  joiningDate: string;
  department: string;
  specialization: string;
  designation: string;
  email: string;
  phone: string;
  qualification: string[];
  medicalRegistrationNumber?: string;
  consultationFee?: number;
  time: string;
  avatar: string;
}
