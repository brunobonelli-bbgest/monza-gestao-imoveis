import React, { ReactNode } from 'react';
import { AdminProvider } from './AdminContext';
import { RealEstateProvider, RealEstateContextType } from './RealEstateContext';
import { FinanceProvider, FinanceContextType } from './FinanceContext';
import { OpsProvider, OpsContextType } from './OpsContext';
import { AdminContextType } from './AdminContext';
import { useRealEstate } from '../hooks/useRealEstate';
import { useFinance } from '../hooks/useFinance';
import { useOps } from '../hooks/useOps';
import { useAdmin } from '../hooks/useAdmin';

export interface DataContextType extends RealEstateContextType, FinanceContextType, OpsContextType, AdminContextType {}

export const DataProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AdminProvider>
      <RealEstateProvider>
        <FinanceProvider>
          <OpsProvider>
            {children}
          </OpsProvider>
        </FinanceProvider>
      </RealEstateProvider>
    </AdminProvider>
  );
};

export const useData = (): DataContextType => {
  const realEstate = useRealEstate();
  const finance = useFinance();
  const ops = useOps();
  const admin = useAdmin();
  
  return {
    ...realEstate,
    ...finance,
    ...ops,
    ...admin
  };
};
