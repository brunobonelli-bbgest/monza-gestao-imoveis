export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  value: number;
  status: 'pending' | 'completed';
  relatedId?: string; // e.g., leaseId or installmentId
  propertyId?: string;
  ownerId?: string;
  competenceDate?: string; // YYYY-MM
  isDeleted?: boolean;
  deleteJustification?: string;
  createdAt?: string;
  updatedAt?: string;
}
