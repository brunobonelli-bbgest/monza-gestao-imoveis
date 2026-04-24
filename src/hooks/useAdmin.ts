import { useContext } from 'react';
import { AdminContext, AdminContextType } from '../context/AdminContext';

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
