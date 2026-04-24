export interface Owner {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  pixKey?: string;
  reportPreference: 'monthly' | 'quarterly' | 'yearly';
  personType?: 'PF' | 'PJ';
  companyName?: string;
  stateRegistration?: string;
  bank_info?: {
    bank_name?: string;
    agency?: string;
    account?: string;
    pix_key?: string;
    person_type?: string;
    company_name?: string;
    state_registration?: string;
    report_preference?: string;
  };
}

export interface Tenant {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  occupation?: string;
  income?: number;
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
}
