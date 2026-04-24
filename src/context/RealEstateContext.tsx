import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode, useContext } from 'react';
import { Owner, Property, Tenant, Lease } from '../types';
import { realEstateStorage } from '../storage/realEstateStorage';
import { computePropertyStatus, expireLeasesIfNeeded } from '../domain/realEstate/rules';
import { AdminContext } from './AdminContext';
import { AuthContext } from '../auth/AuthProvider';
import { auditService } from '../services/auditService';
import { supabaseDataService } from '../services/supabaseDataService';

export interface RealEstateContextType {
  owners: Owner[];
  properties: Property[];
  tenants: Tenant[];
  leases: Lease[];
  loading: boolean;
  addOwner: (owner: Owner) => Promise<Owner>;
  updateOwner: (owner: Owner) => Promise<Owner>;
  deleteOwner: (id: string) => Promise<void>;
  addProperty: (property: Property) => Promise<Property>;
  updateProperty: (property: Property) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  deletePropertyWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  addTenant: (tenant: Tenant) => Promise<Tenant>;
  updateTenant: (tenant: Tenant) => Promise<Tenant>;
  deleteTenant: (id: string) => Promise<void>;
  deleteTenantWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  addLease: (lease: Lease) => Promise<Lease>;
  updateLease: (lease: Lease) => Promise<Lease>;
  deleteLease: (id: string) => Promise<void>;
  deleteLeaseWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  deleteOwnerWithAudit: (id: string, details: string, justification: string) => Promise<void>;
}

export const RealEstateContext = createContext<RealEstateContextType | undefined>(undefined);

export const RealEstateProvider = ({ children }: { children: ReactNode }) => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
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
          // Fetching data from Supabase
          const [sOwners, sProperties, sTenants, sLeases] = await Promise.all([
            supabaseDataService.getOwners().catch(e => { console.error('[RealEstate] Error fetching owners:', e); throw e; }),
            supabaseDataService.getProperties().catch(e => { console.error('[RealEstate] Error fetching properties:', e); throw e; }),
            supabaseDataService.getTenants().catch(e => { console.error('[RealEstate] Error fetching tenants:', e); throw e; }),
            supabaseDataService.getLeases().catch(e => { console.error('[RealEstate] Error fetching leases:', e); throw e; })
          ]);
          
          if (isMounted) {
            setOwners(sOwners);
            setProperties(sProperties);
            setTenants(sTenants);
            setLeases(sLeases);
          }
        } else if (!auth.loading) {
          // Use local storage if not authenticated
          const localData = realEstateStorage.get();
          if (isMounted) {
            setOwners(localData.owners);
            setProperties(localData.properties);
            setTenants(localData.tenants);
            setLeases(localData.leases);
          }
        }
      } catch (error) {
        console.error('[RealEstateContext] Critical error loading data:', error);
        // Fallback to local storage on error
        if (isMounted) {
          const localData = realEstateStorage.get();
          setOwners(localData.owners);
          setProperties(localData.properties);
          setTenants(localData.tenants);
          setLeases(localData.leases);
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
      realEstateStorage.save({ owners, properties, tenants, leases });
    }
  }, [owners, properties, tenants, leases, loading]);

  // Business Rule: Expire leases if needed
  useEffect(() => {
    const { updatedLeases, changed } = expireLeasesIfNeeded(leases);
    if (changed) {
      setLeases(updatedLeases);
    }
  }, [leases]);

  // Business Rule: Sync property status with active leases
  useEffect(() => {
    setProperties(prev => {
      let changed = false;
      const next = prev.map(p => {
        const newStatus = computePropertyStatus(p, leases);
        if (newStatus !== p.status) {
          changed = true;
          return { ...p, status: newStatus };
        }
        return p;
      });
      return changed ? next : prev;
    });
  }, [leases]);

  const addOwner = useCallback(async (owner: Owner) => {
    // Optimistic update
    setOwners(prev => {
      const exists = prev.some(o => o.id === owner.id);
      return exists ? prev.map(o => o.id === owner.id ? owner : o) : [owner, ...prev];
    });

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveOwner(owner);
        if (saved && saved.id !== owner.id) {
          const updatedOwner = { ...owner, id: saved.id };
          setOwners(prev => prev.map(o => o.id === owner.id ? updatedOwner : o));
          return updatedOwner;
        }
        return owner;
      }
      return owner;
    } catch (error) {
      console.error('Error adding owner:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateOwner = useCallback(async (owner: Owner) => {
    // Optimistic update
    setOwners(prev => prev.map(o => o.id === owner.id ? owner : o));

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveOwner(owner);
        if (saved && saved.id !== owner.id) {
          const updatedOwner = { ...owner, id: saved.id };
          setOwners(prev => prev.map(o => o.id === owner.id ? updatedOwner : o));
          return updatedOwner;
        }
        return owner;
      }
      return owner;
    } catch (error) {
      console.error('Error updating owner:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const deleteOwner = useCallback(async (id: string) => {
    try {
      const ownerToDelete = owners.find(o => o.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteOwner(id);
        
        // Audit Log
        if (adminContext?.addAuditLog && ownerToDelete) {
          const log = auditService.createLog('DELETE', 'owners', id, ownerToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setOwners(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Error deleting owner:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, owners, adminContext]);

  const addProperty = useCallback(async (property: Property) => {
    const status = computePropertyStatus(property, leases);
    const propertyWithStatus = { ...property, status };

    // Optimistic update
    setProperties(prev => {
      const exists = prev.some(p => p.id === property.id);
      return exists ? prev.map(p => p.id === property.id ? propertyWithStatus : p) : [propertyWithStatus, ...prev];
    });

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveProperty(property);
        if (saved && saved.id !== property.id) {
          const updatedProperty = { ...propertyWithStatus, id: saved.id };
          setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));
          return updatedProperty;
        }
        return propertyWithStatus;
      }
      return propertyWithStatus;
    } catch (error) {
      console.error('Error adding property:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, leases]);

  const updateProperty = useCallback(async (property: Property) => {
    const status = computePropertyStatus(property, leases);
    const propertyWithStatus = { ...property, status };

    // Optimistic update
    setProperties(prev => prev.map(p => p.id === property.id ? propertyWithStatus : p));

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveProperty(property);
        if (saved && saved.id !== property.id) {
          const updatedProperty = { ...propertyWithStatus, id: saved.id };
          setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));
          return updatedProperty;
        }
        return propertyWithStatus;
      }
      return propertyWithStatus;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, leases]);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      const propertyToDelete = properties.find(p => p.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteProperty(id);

        // Audit Log
        if (adminContext?.addAuditLog && propertyToDelete) {
          const log = auditService.createLog('DELETE', 'properties', id, propertyToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, properties, adminContext]);

  const addTenant = useCallback(async (tenant: Tenant) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveTenant(tenant);
        if (saved) {
          setTenants(prev => {
            const exists = prev.some(t => t.id === saved.id);
            return exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
          });
          return saved;
        }
      }
      return tenant;
    } catch (error) {
      console.error('Error adding tenant:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateTenant = useCallback(async (tenant: Tenant) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveTenant(tenant);
        if (saved) {
          setTenants(prev => prev.map(t => t.id === saved.id ? saved : t));
          return saved;
        }
      }
      return tenant;
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const deleteTenant = useCallback(async (id: string) => {
    try {
      const tenantToDelete = tenants.find(t => t.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteTenant(id);

        // Audit Log
        if (adminContext?.addAuditLog && tenantToDelete) {
          const log = auditService.createLog('DELETE', 'tenants', id, tenantToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setTenants(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, tenants, adminContext]);

  const addLease = useCallback(async (lease: Lease) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveLease(lease);
        if (saved) {
          setLeases(prev => {
            const exists = prev.some(l => l.id === saved.id);
            return exists ? prev.map(l => l.id === saved.id ? saved : l) : [saved, ...prev];
          });
          return saved;
        }
      }
      return lease;
    } catch (error) {
      console.error('Error adding lease:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateLease = useCallback(async (lease: Lease) => {
    // Optimistic update
    setLeases(prev => prev.map(l => l.id === lease.id ? lease : l));

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveLease(lease);
        if (saved && saved.id !== lease.id) {
          const updatedLease = { ...lease, id: saved.id };
          setLeases(prev => prev.map(l => l.id === lease.id ? updatedLease : l));
          return updatedLease;
        }
        return lease;
      }
      return lease;
    } catch (error) {
      console.error('Error updating lease:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const deleteLease = useCallback(async (id: string) => {
    try {
      const leaseToDelete = leases.find(l => l.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteLease(id);

        // Audit Log
        if (adminContext?.addAuditLog && leaseToDelete) {
          const log = auditService.createLog('DELETE', 'leases', id, leaseToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setLeases(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting lease:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, leases, adminContext]);

  const deleteTenantWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    await deleteTenant(id);
  }, [deleteTenant]);

  const deleteOwnerWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    await deleteOwner(id);
  }, [deleteOwner]);

  const deletePropertyWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    await deleteProperty(id);
  }, [deleteProperty]);

  const deleteLeaseWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    await deleteLease(id);
  }, [deleteLease]);

  const value = useMemo(() => ({
    owners, properties, tenants, leases, loading,
    addOwner, updateOwner, deleteOwner, deleteOwnerWithAudit,
    addProperty, updateProperty, deleteProperty, deletePropertyWithAudit,
    addTenant, updateTenant, deleteTenant, deleteTenantWithAudit,
    addLease, updateLease, deleteLease, deleteLeaseWithAudit
  }), [
    owners, properties, tenants, leases, loading,
    addOwner, updateOwner, deleteOwner, deleteOwnerWithAudit,
    addProperty, updateProperty, deleteProperty, deletePropertyWithAudit,
    addTenant, updateTenant, deleteTenant, deleteTenantWithAudit,
    addLease, updateLease, deleteLease, deleteLeaseWithAudit
  ]);

  return <RealEstateContext.Provider value={value}>{children}</RealEstateContext.Provider>;
};
