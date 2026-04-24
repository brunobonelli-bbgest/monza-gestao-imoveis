import { Incident, Inspection, Vendor } from '../types';
import { MOCK_INCIDENTS, MOCK_INSPECTIONS, MOCK_VENDORS } from '../mockData';
import { storage } from './base';
import { STORAGE_KEYS } from '../config/storageKeys';

const KEY = STORAGE_KEYS.OPS;

export const opsStorage = {
  get: () => {
    const data = storage.get(KEY, { 
      incidents: MOCK_INCIDENTS, 
      inspections: MOCK_INSPECTIONS, 
      vendors: MOCK_VENDORS 
    });
    return {
      incidents: Array.isArray(data?.incidents) ? data.incidents : MOCK_INCIDENTS,
      inspections: Array.isArray(data?.inspections) ? data.inspections : MOCK_INSPECTIONS,
      vendors: Array.isArray(data?.vendors) ? data.vendors : MOCK_VENDORS,
    };
  },
  save: (data: { incidents: Incident[], inspections: Inspection[], vendors: Vendor[] }) => {
    storage.set(KEY, data);
  }
};
