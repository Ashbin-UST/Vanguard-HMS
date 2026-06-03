import api from "./api";

export type PatientRegisterPayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
  gender: string;
  dob: string;
  address: {
    houseName: string;
    houseNumber: string;
    city: string;
    postCode: string;
  };
  emergencyContact: {
    contactName: string;
    relationship: string;
    contactNumber: string;
  };
};

export type PatientLoginPayload = {
  email: string;
  password: string;
};

export const registerPatient = async (payload: PatientRegisterPayload) => {
  const response = await api.post("/patient-auth/register", payload);
  return response.data;
};

export const loginPatient = async (payload: PatientLoginPayload) => {
  const response = await api.post("/patient-auth/login", payload);
  return response.data;
};

export const getPatientProfile = async () => {
  const response = await api.get("/patient-auth/me");
  return response.data;
};