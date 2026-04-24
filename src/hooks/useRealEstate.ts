import { useContext } from 'react';
import { RealEstateContext, RealEstateContextType } from '../context/RealEstateContext';

export const useRealEstate = (): RealEstateContextType => {
  const context = useContext(RealEstateContext);
  if (context === undefined) {
    throw new Error('useRealEstate must be used within a RealEstateProvider');
  }
  return context;
};
