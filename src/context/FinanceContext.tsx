import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode, useContext } from 'react';
import { Installment, Transaction } from '../types';
import { financeStorage } from '../storage/financeStorage';
import { syncInstallmentTransactions } from '../domain/finance/rules';
import { AdminContext } from './AdminContext';
import { AuthContext } from '../auth/AuthProvider';
import { auditService } from '../services/auditService';
import { supabaseDataService } from '../services/supabaseDataService';

export interface FinanceContextType {
  installments: Installment[];
  transactions: Transaction[];
  loading: boolean;
  addInstallment: (installment: Installment) => Promise<Installment>;
  addInstallments: (installments: Installment[]) => Promise<Installment[]>;
  updateInstallment: (installment: Installment, auditDetails?: { action: string, justification: string }) => Promise<Installment>;
  receiveInstallment: (id: string, paidAt: string, justification: string) => Promise<void>;
  revertInstallmentReceipt: (id: string, justification: string) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
  deleteInstallmentWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  deleteRemittanceWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<Transaction>;
  updateTransaction: (transaction: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactionWithAudit: (id: string, details: string, justification: string) => Promise<void>;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const adminContext = useContext(AdminContext);
  const auth = useContext(AuthContext);

  // Load data from Supabase or LocalStorage
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!auth || auth.loading) return;

      setLoading(true);
      try {
        if (auth.isAuthenticated && auth.user) {
          const [sInstallments, sTransactions] = await Promise.all([
            supabaseDataService.getInstallments().catch(e => { console.error('[Finance] Error fetching installments:', e); throw e; }),
            supabaseDataService.getTransactions().catch(e => { console.error('[Finance] Error fetching transactions:', e); throw e; })
          ]);
          
          if (isMounted) {
            setInstallments(sInstallments);
            setTransactions(sTransactions);
          }
        } else if (!auth.loading) {
          const localData = financeStorage.get();
          if (isMounted) {
            setInstallments(localData.installments);
            setTransactions(localData.transactions);
          }
        }
      } catch (error) {
        console.error('[FinanceContext] Critical error loading data:', error);
        if (isMounted) {
          const localData = financeStorage.get();
          setInstallments(localData.installments);
          setTransactions(localData.transactions);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [auth?.isAuthenticated, auth?.loading, auth?.user?.id]);

  // Save to LocalStorage as backup
  useEffect(() => {
    if (!loading) {
      financeStorage.save({ installments, transactions });
    }
  }, [installments, transactions, loading]);

  const addInstallment = useCallback(async (installment: Installment) => {
    const now = new Date().toISOString();
    const instWithTimestamps = {
      ...installment,
      createdAt: installment.createdAt || now
    };

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveInstallment(instWithTimestamps);
        if (saved) {
          setInstallments(prev => {
            const exists = prev.some(i => i.id === saved.id);
            return exists ? prev.map(i => i.id === saved.id ? saved : i) : [saved, ...prev];
          });
          return saved;
        }
      }
      return instWithTimestamps;
    } catch (error) {
      console.error('Error adding installment:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const addInstallments = useCallback(async (newInsts: Installment[]) => {
    const now = new Date().toISOString();
    const instsWithTimestamps = newInsts.map(inst => ({
      ...inst,
      createdAt: inst.createdAt || now
    }));

    try {
      if (auth?.isAuthenticated) {
        const savedResults = await Promise.all(instsWithTimestamps.map(i => supabaseDataService.saveInstallment(i)));
        
        const finalResults = savedResults.filter((r): r is Installment => r !== null);
        
        setInstallments(prev => {
          const filtered = prev.filter(p => !finalResults.some(n => n.id === p.id));
          return [...finalResults, ...filtered];
        });
        
        return finalResults;
      }
      return instsWithTimestamps;
    } catch (error) {
      console.error('Error adding installments:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateInstallment = useCallback(async (installment: Installment, auditDetails?: { action: string, justification: string }) => {
    const now = new Date().toISOString();
    const instWithTimestamps = {
      ...installment
    };
    
    // Optimistic update
    setInstallments(prev => prev.map(i => i.id === instWithTimestamps.id ? instWithTimestamps : i));

    // Business Rule: Sync transactions
    const { updatedTransactions, changed } = syncInstallmentTransactions(instWithTimestamps, transactions);
    
    if (changed) {
      setTransactions(updatedTransactions);
      
      // Persist synced transactions if authenticated
      if (auth?.isAuthenticated) {
        const oldRelated = transactions.filter(t => t.relatedId === instWithTimestamps.id);
        const newRelated = updatedTransactions.filter(t => t.relatedId === instWithTimestamps.id);
        
        // 1. Delete removed transactions
        const toDelete = oldRelated.filter(old => !newRelated.some(n => n.id === old.id));
        for (const t of toDelete) {
          await supabaseDataService.deleteTransaction(t.id);
        }
        
        // 2. Save added/updated transactions
        for (const t of newRelated) {
          const old = oldRelated.find(o => o.id === t.id);
          // Only save if it's new or actually changed
          if (!old || old.value !== t.value || old.date !== t.date || old.status !== t.status || old.isDeleted !== t.isDeleted) {
            try {
              const saved = await supabaseDataService.saveTransaction(t);
              if (saved && saved.id !== t.id) {
                // Update state with real UUID from database
                setTransactions(prev => prev.map(item => 
                  item.id === t.id ? { ...t, id: saved.id, createdAt: saved.created_at } : item
                ));
              }
            } catch (err) {
              console.error('Error persisting synced transaction:', err);
            }
          }
        }
      }
    }

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveInstallment(instWithTimestamps);
        
        // Audit Log if provided
        if (auditDetails && adminContext?.addAuditLog) {
          const log = auditService.createLog(
            auditDetails.action, 
            'installments', // tableName
            installment.id, // recordId
            auditDetails.justification, 
            `Alteração de parcela: ${installment.propertyTitle} | Status: ${installment.status}`,
            auth.user?.id
          );
          adminContext.addAuditLog(log);
        }

        if (saved && saved.id !== instWithTimestamps.id) {
          const updatedInst = { ...instWithTimestamps, id: saved.id };
          setInstallments(prev => prev.map(i => i.id === instWithTimestamps.id ? updatedInst : i));
          return updatedInst;
        }
        return instWithTimestamps;
      }
      return instWithTimestamps;
    } catch (error) {
      console.error('Error updating installment:', error);
      throw error;
    }
  }, [adminContext, auth?.isAuthenticated]);

  const receiveInstallment = useCallback(async (id: string, paidAt: string, justification: string) => {
    const installment = installments.find(i => i.id === id);
    if (!installment) return;

    const updatedInstallment: Installment = {
      ...installment,
      status: 'paid',
      paidAt
    };

    await updateInstallment(updatedInstallment, { 
      action: 'receive_installment', 
      justification 
    });
  }, [installments, updateInstallment]);

  const revertInstallmentReceipt = useCallback(async (id: string, justification: string) => {
    const installment = installments.find(i => i.id === id);
    if (!installment) return;

    const updatedInstallment: Installment = {
      ...installment,
      status: 'pending',
      paidAt: undefined,
      remittanceStatus: 'pending',
      remittanceDate: undefined
    };

    await updateInstallment(updatedInstallment, { 
      action: 'revert_installment', 
      justification 
    });
  }, [installments, updateInstallment]);

  const deleteInstallment = useCallback(async (id: string) => {
    try {
      const installmentToDelete = installments.find(i => i.id === id);
      if (auth?.isAuthenticated) {
        // Delete linked transactions in Supabase
        const related = transactions.filter(t => t.relatedId === id);
        for (const t of related) {
          await supabaseDataService.deleteTransaction(t.id);
        }
        await supabaseDataService.deleteInstallment(id);

        // Audit Log
        if (adminContext?.addAuditLog && installmentToDelete) {
          const log = auditService.createLog('DELETE', 'installments', id, installmentToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setInstallments(prev => prev.filter(i => i.id !== id));
      setTransactions(prev => prev.filter(t => t.relatedId !== id));
    } catch (error) {
      console.error('Error deleting installment:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, installments, transactions, adminContext]);

  const deleteInstallmentWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    // Just call deleteInstallment which now has audit
    await deleteInstallment(id);
  }, [deleteInstallment]);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    const now = new Date().toISOString();
    const transWithTimestamps = {
      ...transaction,
      createdAt: transaction.createdAt || now
    };

    // Optimistic update
    setTransactions(prev => {
      const exists = prev.some(t => t.id === transWithTimestamps.id);
      return exists ? prev.map(t => t.id === transWithTimestamps.id ? transWithTimestamps : t) : [transWithTimestamps, ...prev];
    });

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveTransaction(transWithTimestamps);
        if (saved && (saved.id !== transWithTimestamps.id || saved.created_at !== transWithTimestamps.createdAt)) {
          const updatedTrans = { ...transWithTimestamps, id: saved.id, createdAt: saved.created_at };
          setTransactions(prev => prev.map(t => t.id === transWithTimestamps.id ? updatedTrans : t));
          return updatedTrans;
        }
        return transWithTimestamps;
      }
      return transWithTimestamps;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    const now = new Date().toISOString();
    const transWithTimestamps = {
      ...transaction
    };

    // Optimistic update
    setTransactions(prev => prev.map(t => t.id === transWithTimestamps.id ? transWithTimestamps : t));

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveTransaction(transWithTimestamps);
        if (saved && (saved.id !== transWithTimestamps.id || saved.created_at !== transWithTimestamps.createdAt)) {
          const updatedTrans = { ...transWithTimestamps, id: saved.id, createdAt: saved.created_at };
          setTransactions(prev => prev.map(t => t.id === transWithTimestamps.id ? updatedTrans : t));
          return updatedTrans;
        }
        return transWithTimestamps;
      }
      return transWithTimestamps;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const transactionToDelete = transactions.find(t => t.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteTransaction(id);

        // Audit Log
        if (adminContext?.addAuditLog && transactionToDelete) {
          const log = auditService.createLog('DELETE', 'transactions', id, transactionToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, transactions, adminContext]);

  const deleteRemittanceWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    // Just call deleteInstallment which now has audit
    await deleteInstallment(id);
  }, [deleteInstallment]);

  const deleteTransactionWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    // Just call deleteTransaction which now has audit
    await deleteTransaction(id);
  }, [deleteTransaction]);

  const value = useMemo(() => ({
    installments, transactions, loading,
    addInstallment, addInstallments, updateInstallment, 
    receiveInstallment, revertInstallmentReceipt,
    deleteInstallment, deleteInstallmentWithAudit,
    addTransaction, updateTransaction, deleteTransaction,
    deleteRemittanceWithAudit, deleteTransactionWithAudit
  }), [
    installments, transactions, loading,
    addInstallment, addInstallments, updateInstallment, 
    receiveInstallment, revertInstallmentReceipt,
    deleteInstallment, deleteInstallmentWithAudit,
    addTransaction, updateTransaction, deleteTransaction,
    deleteRemittanceWithAudit, deleteTransactionWithAudit
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

