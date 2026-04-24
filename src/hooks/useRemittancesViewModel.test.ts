import { renderHook, act } from '@testing-library/react';
import { useRemittancesViewModel } from './useRemittancesViewModel';
import { useData } from '../context/DataContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useData
vi.mock('../context/DataContext', () => ({
  useData: vi.fn(),
}));

const mockOwners = [{ id: 'o1', name: 'Owner 1' }];
const mockProperties = [{ id: 'p1', title: 'Property 1', ownerId: 'o1' }];
const mockLeases = [{ id: 'l1', propertyId: 'p1', ownerId: 'o1', contractNumber: 'C123' }];
const mockInstallments = [
  { 
    id: 'i1', 
    leaseId: 'l1', 
    status: 'paid', 
    dueDate: '2026-02-01', 
    ownerValue: 1000, 
    value: 1200, 
    agencyFeeValue: 200,
    remittanceStatus: 'pending',
    agencyFeeStatus: 'pending'
  }
];

describe('useRemittancesViewModel', () => {
  const mockUpdateInstallment = vi.fn();
  const mockAddTransaction = vi.fn();
  const mockDeleteTransaction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useData as any).mockReturnValue({
      owners: mockOwners,
      properties: mockProperties,
      leases: mockLeases,
      tenants: [],
      installments: mockInstallments,
      transactions: [],
      updateInstallment: mockUpdateInstallment,
      addTransaction: mockAddTransaction,
      deleteTransaction: mockDeleteTransaction,
    });
  });

  it('should filter remittances correctly', () => {
    const { result } = renderHook(() => useRemittancesViewModel());
    
    expect(result.current.filteredRemittances).toHaveLength(1);
    expect(result.current.totals.pending).toBe(1000);
  });

  it('should handle search correctly', () => {
    const { result } = renderHook(() => useRemittancesViewModel());
    
    act(() => {
      result.current.setSearchTerm('Non-existent');
    });
    
    expect(result.current.filteredRemittances).toHaveLength(0);
    
    act(() => {
      result.current.setSearchTerm('Owner 1');
    });
    
    expect(result.current.filteredRemittances).toHaveLength(1);
  });

  it('should confirm remittance and create transaction', () => {
    const { result } = renderHook(() => useRemittancesViewModel());
    
    act(() => {
      result.current.handleConfirmRemittance(mockInstallments[0] as any);
    });
    
    expect(mockUpdateInstallment).toHaveBeenCalledWith(expect.objectContaining({
      remittanceStatus: 'completed'
    }));
    
    expect(mockAddTransaction).toHaveBeenCalledWith(expect.objectContaining({
      type: 'expense',
      relatedId: 'i1'
    }));
  });

  it('should not duplicate transactions if already confirmed', () => {
    (useData as any).mockReturnValue({
      owners: mockOwners,
      properties: mockProperties,
      leases: mockLeases,
      tenants: [],
      installments: mockInstallments,
      transactions: [{ relatedId: 'i1', category: 'Repasse Proprietário' }], // Already exists with correct category
      updateInstallment: mockUpdateInstallment,
      addTransaction: mockAddTransaction,
      deleteTransaction: mockDeleteTransaction,
    });

    const { result } = renderHook(() => useRemittancesViewModel());
    
    act(() => {
      result.current.handleConfirmRemittance(mockInstallments[0] as any);
    });
    
    expect(mockAddTransaction).not.toHaveBeenCalled();
  });
});
