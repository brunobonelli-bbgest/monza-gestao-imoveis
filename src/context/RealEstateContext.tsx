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

  const normalizeOwner = (owner: any, fallback?: Owner): Owner => ({
    ...(fallback || {}),
    ...owner,
    id: owner.id,
    bankName: owner.bank_info?.bank_name ?? fallback?.bankName,
    bankAgency: owner.bank_info?.agency ?? fallback?.bankAgency,
    bankAccount: owner.bank_info?.account ?? fallback?.bankAccount,
    pixKey: owner.bank_info?.pix_key ?? fallback?.pixKey,
    personType: owner.bank_info?.person_type ?? fallback?.personType,
    companyName: owner.bank_info?.company_name ?? fallback?.companyName,
    stateRegistration: owner.bank_info?.state_registration ?? fallback?.stateRegistration,
    reportPreference: owner.bank_info?.report_preference ?? fallback?.reportPreference ?? 'monthly',
  }) as Owner;

  const normalizeProperty = (property: any, fallback?: Property): Property => ({
    ...(fallback || {}),
    ...property,
    id: property.id,
    ownerId: property.owner_id ?? fallback?.ownerId,
    rentValue: property.rent_value ?? fallback?.rentValue,
    isUnderMaintenance: property.is_under_maintenance ?? fallback?.isUnderMaintenance ?? false,
  }) as Property;

  const normalizeLease = (lease: any, fallback?: Lease): Lease => ({
    ...(fallback || {}),
    ...lease,
    id: lease.id,
    propertyId: lease.property_id ?? fallback?.propertyId,
    ownerId: lease.owner_id ?? fallback?.ownerId,
    tenantId: lease.tenant_id ?? fallback?.tenantId,
    contractNumber: lease.contract_number ?? fallback?.contractNumber,
    startDate: lease.start_date ?? fallback?.startDate,
    endDate: lease.end_date ?? fallback?.endDate,
    rentValue: lease.rent_value ?? fallback?.rentValue,
    managementFee: lease.management_fee ?? fallback?.managementFee,
    dueDay: lease.due_day ?? fallback?.dueDay,
    adjustmentIndex: lease.adjustment_index ?? fallback?.adjustmentIndex,
    fees: {
      condo: lease.condo_fee ?? fallback?.fees?.condo ?? 0,
      tax: lease.tax_fee ?? fallback?.fees?.tax ?? 0,
    },
  }) as Lease;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!auth || auth.loading) return;

      setLoading(true);

      try {
        if (auth.isAuthenticated && auth.user) {
          const [sOwners, sProperties, sTenants, sLeases] = await Promise.all([
            supabaseDataService.getOwners(),
            supabaseDataService.getProperties(),
            supabaseDataService.getTenants(),
            supabaseDataService.getLeases(),
          ]);

          if (isMounted) {
            setOwners(sOwners);
            setProperties(sProperties);
            setTenants(sTenants);
            setLeases(sLeases);
          }
        } else if (!auth.loading) {
          const localData = realEstateStorage.get();

          if (isMounted) {
            setOwners(localData.owners);
            setProperties(localData.properties);
            setTenants(localData.tenants);
            setLeases(localData.leases);
          }
        }
      } catch (error) {
        console.error('[RealEstateContext] Erro ao carregar dados:', error);

        if (isMounted) {
          const localData = realEstateStorage.get();
          setOwners(localData.owners);
          setProperties(localData.properties);
          setTenants(localData.tenants);
          setLeases(localData.leases);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [auth?.isAuthenticated, auth?.loading, auth?.user?.id]);

  useEffect(() => {
    if (!loading) {
      realEstateStorage.save({ owners, properties, tenants, leases });
    }
  }, [owners, properties, tenants, leases, loading]);

  useEffect(() => {
    const { updatedLeases, changed } = expireLeasesIfNeeded(leases);
    if (changed) setLeases(updatedLeases);
  }, [leases]);

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
    try {
      if (auth?.isAuthenticated) {
        const ownerForInsert = { ...owner, id: '' };
        const saved = await supabaseDataService.saveOwner(ownerForInsert as Owner);
        const normalizedOwner = normalizeOwner(saved, owner);

        setOwners(prev => [normalizedOwner, ...prev]);
        return normalizedOwner;
      }

      setOwners(prev => [owner, ...prev]);
      return owner;
    } catch (error) {
      console.error('Erro ao adicionar proprietário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateOwner = useCallback(async (owner: Owner) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveOwner(owner);
        const normalizedOwner = normalizeOwner(saved, owner);

        setOwners(prev => prev.map(o => o.id === owner.id ? normalizedOwner : o));
        return normalizedOwner;
      }

      setOwners(prev => prev.map(o => o.id === owner.id ? owner : o));
      return owner;
    } catch (error) {
      console.error('Erro ao atualizar proprietário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const deleteOwner = useCallback(async (id: string) => {
    try {
      const ownerToDelete = owners.find(o => o.id === id);

      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteOwner(id);

        if (adminContext?.addAuditLog && ownerToDelete) {
          const log = auditService.createLog('DELETE', 'owners', id, ownerToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }

      setOwners(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Erro ao excluir proprietário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, owners, adminContext]);

  const addProperty = useCallback(async (property: Property) => {
    try {
      const status = computePropertyStatus(property, leases);
      const propertyWithStatus = { ...property, status };

      if (auth?.isAuthenticated) {
        const propertyForInsert = { ...propertyWithStatus, id: '' };
        const saved = await supabaseDataService.saveProperty(propertyForInsert as Property);
        const normalizedProperty = normalizeProperty(saved, propertyWithStatus);

        setProperties(prev => [normalizedProperty, ...prev]);
        return normalizedProperty;
      }

      setProperties(prev => [propertyWithStatus, ...prev]);
      return propertyWithStatus;
    } catch (error) {
      console.error('Erro ao adicionar imóvel:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, leases]);

  const updateProperty = useCallback(async (property: Property) => {
    try {
      const status = computePropertyStatus(property, leases);
      const propertyWithStatus = { ...property, status };

      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveProperty(propertyWithStatus);
        const normalizedProperty = normalizeProperty(saved, propertyWithStatus);

        setProperties(prev => prev.map(p => p.id === property.id ? normalizedProperty : p));
        return normalizedProperty;
      }

      setProperties(prev => prev.map(p => p.id === property.id ? propertyWithStatus : p));
      return propertyWithStatus;
    } catch (error) {
      console.error('Erro ao atualizar imóvel:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, leases]);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      const propertyToDelete = properties.find(p => p.id === id);

      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteProperty(id);

        if (adminContext?.addAuditLog && propertyToDelete) {
          const log = auditService.createLog('DELETE', 'properties', id, propertyToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }

      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erro ao excluir imóvel:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, properties, adminContext]);

  const addTenant = useCallback(async (tenant: Tenant) => {
    try {
      if (auth?.isAuthenticated) {
        const tenantForInsert = { ...tenant, id: '' };
        const saved = await supabaseDataService.saveTenant(tenantForInsert as Tenant);

        setTenants(prev => [saved, ...prev]);
        return saved;
      }

      setTenants(prev => [tenant, ...prev]);
      return tenant;
    } catch (error) {
      console.error('Erro ao adicionar locatário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateTenant = useCallback(async (tenant: Tenant) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveTenant(tenant);

        setTenants(prev => prev.map(t => t.id === tenant.id ? saved : t));
        return saved;
      }

      setTenants(prev => prev.map(t => t.id === tenant.id ? tenant : t));
      return tenant;
    } catch (error) {
      console.error('Erro ao atualizar locatário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const deleteTenant = useCallback(async (id: string) => {
    try {
      const tenantToDelete = tenants.find(t => t.id === id);

      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteTenant(id);

        if (adminContext?.addAuditLog && tenantToDelete) {
          const log = auditService.createLog('DELETE', 'tenants', id, tenantToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }

      setTenants(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao excluir locatário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, tenants, adminContext]);

  const addLease = useCallback(async (lease: Lease) => {
    try {
      if (auth?.isAuthenticated) {
        const leaseForInsert = { ...lease, id: '' };
        const saved = await supabaseDataService.saveLease(leaseForInsert as Lease);
        const normalizedLease = normalizeLease(saved, lease);

        setLeases(prev => [normalizedLease, ...prev]);
        return normalizedLease;
      }

      setLeases(prev => [lease, ...prev]);
      return lease;
    } catch (error) {
      console.error('Erro ao adicionar contrato:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const updateLease = useCallback(async (lease: Lease) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveLease(lease);
        const normalizedLease = normalizeLease(saved, lease);

        setLeases(prev => prev.map(l => l.id === lease.id ? normalizedLease : l));
        return normalizedLease;
      }

      setLeases(prev => prev.map(l => l.id === lease.id ? lease : l));
      return lease;
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      throw error;
    }
  }, [auth?.isAuthenticated]);

  const deleteLease = useCallback(async (id: string) => {
    try {
      const leaseToDelete = leases.find(l => l.id === id);

      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteLease(id);

        if (adminContext?.addAuditLog && leaseToDelete) {
          const log = auditService.createLog('DELETE', 'leases', id, leaseToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }

      setLeases(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
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
    owners,
    properties,
    tenants,
    leases,
    loading,
    addOwner,
    updateOwner,
    deleteOwner,
    deleteOwnerWithAudit,
    addProperty,
    updateProperty,
    deleteProperty,
    deletePropertyWithAudit,
    addTenant,
    updateTenant,
    deleteTenant,
    deleteTenantWithAudit,
    addLease,
    updateLease,
    deleteLease,
    deleteLeaseWithAudit,
  }), [
    owners,
    properties,
    tenants,
    leases,
    loading,
    addOwner,
    updateOwner,
    deleteOwner,
    deleteOwnerWithAudit,
    addProperty,
    updateProperty,
    deleteProperty,
    deletePropertyWithAudit,
    addTenant,
    updateTenant,
    deleteTenant,
    deleteTenantWithAudit,
    addLease,
    updateLease,
    deleteLease,
    deleteLeaseWithAudit,
  ]);

  return (
    <RealEstateContext.Provider value={value}>
      {children}
    </RealEstateContext.Provider>
  );
};

