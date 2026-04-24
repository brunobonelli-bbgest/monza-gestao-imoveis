export interface Incident {
  id: string;
  propertyId: string;
  leaseId?: string;
  vendorId?: string;
  category: 'noise' | 'maintenance' | 'neighborhood' | 'billing' | 'inspection' | 'admin';
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  responsible: string;
  createdAt: string;
  cost?: number;
  attachments?: string[];
}

export interface Inspection {
  id: string;
  propertyId: string;
  type: 'entry' | 'exit' | 'routine';
  date: string;
  status: 'scheduled' | 'completed';
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
  items: {
    room: string;
    item: string;
    condition: 'ok' | 'regular' | 'bad';
    notes?: string;
    photos?: string[];
  }[];
}

export interface Vendor {
  id: string;
  name: string;
  service: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  availability: string;
  averageCost: number;
  rating: number;
  avatar?: string;
  bio?: string;
  completedJobs: number;
  skills: string[];
  createdAt?: string;
  updatedAt?: string;
}
