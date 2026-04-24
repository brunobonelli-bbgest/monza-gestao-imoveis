import { Installment, Transaction } from '../../types';

/**
 * Synchronizes linked transactions when an installment is updated.
 * Ensures consistency between installments, remittances, and cash flow.
 */
export const syncInstallmentTransactions = (
  installment: Installment, 
  transactions: Transaction[]
): { updatedTransactions: Transaction[], changed: boolean } => {
  const now = new Date().toISOString();
  let changed = false;
  
  // 1. Handle deletion/cancellation
  if (installment.isDeleted || installment.status === 'pending' || installment.status === 'overdue') {
    const filtered = transactions.filter(t => t.relatedId !== installment.id);
    if (filtered.length !== transactions.length) {
      return { updatedTransactions: filtered, changed: true };
    }
    return { updatedTransactions: transactions, changed: false };
  }

  // 2. Handle 'paid' status
  if (installment.status === 'paid') {
    const relatedTransactions = transactions.filter(t => t.relatedId === installment.id);
    
    // Check if we need to create or update
    const rentTrans = relatedTransactions.find(t => t.category === 'Aluguel');
    const remittanceTrans = relatedTransactions.find(t => t.category === 'Repasse Proprietário');
    
    let newTransactions = [...transactions];

    // Sync Rent Transaction (Income)
    if (!rentTrans) {
      changed = true;
      newTransactions.push({
        id: `rent-${installment.id}`,
        date: installment.paidAt || now.split('T')[0],
        description: `Aluguel: ${installment.propertyTitle || 'N/A'}`,
        type: 'income',
        category: 'Aluguel',
        value: installment.value,
        status: 'completed',
        relatedId: installment.id,
        competenceDate: installment.dueDate.slice(0, 7),
        createdAt: now
      });
    } else if (rentTrans.value !== installment.value || rentTrans.isDeleted) {
      changed = true;
      newTransactions = newTransactions.map(t => 
        t.id === rentTrans.id ? { ...t, value: installment.value, isDeleted: false } : t
      );
    }

    // Sync Remittance Transaction (Expense) - only if remittance is completed
    if (installment.remittanceStatus === 'completed') {
      if (!remittanceTrans) {
        changed = true;
        newTransactions.push({
          id: `repasse-${installment.id}`,
          date: installment.remittanceDate || now.split('T')[0],
          description: `Repasse: ${installment.ownerName || 'N/A'} - ${installment.propertyTitle || 'N/A'}`,
          type: 'expense',
          category: 'Repasse Proprietário',
          value: installment.ownerValue,
          status: 'completed',
          relatedId: installment.id,
          competenceDate: installment.dueDate.slice(0, 7),
          createdAt: now
        });
      } else if (remittanceTrans.value !== installment.ownerValue || remittanceTrans.isDeleted) {
        changed = true;
        newTransactions = newTransactions.map(t => 
          t.id === remittanceTrans.id ? { ...t, value: installment.ownerValue, isDeleted: false } : t
        );
      }
    } else {
      // If remittance is not completed, ensure no remittance transaction exists
      if (remittanceTrans) {
        changed = true;
        newTransactions = newTransactions.filter(t => t.id !== remittanceTrans.id);
      }
    }

    return { updatedTransactions: newTransactions, changed };
  }

  return { updatedTransactions: transactions, changed: false };
};
