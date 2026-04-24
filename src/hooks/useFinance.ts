import { useContext } from 'react';
import { FinanceContext, FinanceContextType } from '../context/FinanceContext';

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
