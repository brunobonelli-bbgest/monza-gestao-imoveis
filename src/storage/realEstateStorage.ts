import { Owner, Property, Tenant, Lease } from '../types';
import { MOCK_OWNERS, MOCK_PROPERTIES, MOCK_TENANTS, MOCK_LEASES } from '../mockData';
import { storage } from './base';
import { STORAGE_KEYS } from '../config/storageKeys';

const KEY = STORAGE_KEYS.REAL_ESTATE;

export const realEstateStorage = {
  get: () => {
    const data = storage.get(KEY, { 
      owners: MOCK_OWNERS, 
      properties: MOCK_PROPERTIES, 
      tenants: MOCK_TENANTS, 
      leases: MOCK_LEASES 
    });
    return {
      owners: Array.isArray(data?.owners) ? data.owners : MOCK_OWNERS,
      properties: Array.isArray(data?.properties) ? data.properties : MOCK_PROPERTIES,
      tenants: Array.isArray(data?.tenants) ? data.tenants : MOCK_TENANTS,
      leases: Array.isArray(data?.leases) ? data.leases : MOCK_LEASES,
    };
  },
  save: (data: { owners: Owner[], properties: Property[], tenants: Tenant[], leases: Lease[] }) => {
    storage.set(KEY, data);
  }
};
