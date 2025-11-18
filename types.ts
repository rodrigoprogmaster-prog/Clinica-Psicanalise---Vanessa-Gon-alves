
export interface Anamnesis {
  mainComplaint: string;
  historyOfComplaint: string;
  personalHistory: string;
  familyHistory: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  dateOfBirth: string;
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  anamnesis?: Anamnesis;
  isActive: boolean;
}

export interface ConsultationType {
  id: string;
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled';
  consultationTypeId: string;
  price: number;
}

export interface SessionNote {
  id: string;
  patientId: string;
  date: string;
  content: string;
  appointmentId?: string;
}

export interface InternalObservation {
  id: string;
  patientId: string;
  date: string;
  content: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  patientId?: string;
}

export type View = 'dashboard' | 'patients' | 'schedule' | 'pep' | 'financial' | 'admin' | 'managementDashboard' | 'settings' | 'recordsHistory';