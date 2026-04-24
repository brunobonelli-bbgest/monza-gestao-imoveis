export interface Lease {
  id: string;
  contractNumber: string;
  propertyId: string;
  ownerId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentValue: number;
  adjustmentIndex: string;
  deposit: number;
  dueDay: number;
  fees: {
    condo: number;
    tax: number;
  };
  status: 'active' | 'expired' | 'terminated';
  managementFee: number; // percentage, e.g., 10 for 10%
  observations?: string;
}

export interface Installment {
  id: string;
  leaseId: string;
  dueDate: string;
  value: number;
  status: 'paid' | 'overdue' | 'pending';
  paidAt?: string;
  receiptUrl?: string;
  agencyFeeValue: number;
  agencyFeeStatus: 'pending' | 'collected';
  ownerValue: number;
  remittanceStatus: 'pending' | 'completed';
  remittanceDate?: string;
  cancelObservation?: string;
  propertyTitle?: string;
  ownerName?: string;
  isDeleted?: boolean;
  deleteJustification?: string;
  createdAt?: string;
  updatedAt?: string;
  signedReceiptUrl?: string;
  remittanceReceiptUrl?: string;
}
