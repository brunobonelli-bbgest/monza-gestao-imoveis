import { useContext } from 'react';
import { OpsContext, OpsContextType } from '../context/OpsContext';

export const useOps = (): OpsContextType => {
  const context = useContext(OpsContext);
  if (context === undefined) {
    throw new Error('useOps must be used within an OpsProvider');
  }
  return context;
};
