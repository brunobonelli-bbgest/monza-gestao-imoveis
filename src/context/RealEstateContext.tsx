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

  const normalizeOwner = (saved: any, original?: Owner): Owner => ({
    ...(original || {}),
    ...saved,
    id: saved.id,
    bankName: saved.bank_info?.bank_name ?? original?.bankName,
    bankAgency: saved.bank_info?.agency ?? original?.bankAgency,
    bankAccount: saved.bank_info?.account ?? original?.bankAccount,
    pixKey: saved.bank_info?.pix_key ?? original?.pixKey,
    personType: saved.bank_info?.person_type ?? original?.personType,
    companyName: saved.bank_info?.company_name ?? original?.companyName,
    stateRegistration: saved.bank_info?.state_registration ?? original?.stateRegistration,
    reportPreference: saved.bank_info?.report_preference ?? original?.reportPreference ?? 'monthly',
  }) as Owner;

  const normalizeProperty = (saved: any, original?: Property): Property => ({
    ...(original || {}),
    ...saved,
    id: saved.id,
    ownerId: saved.owner_id ?? original?.ownerId,
    rentValue: saved.rent_value ?? original?.rentValue,
    isUnderMaintenance: saved.is_under_maintenance ?? original?.isUnderMaintenance ?? false,
  }) as Property;

  const normalizeLease = (saved: any, original?: Lease): Lease => ({
    ...(original || {}),
    ...saved,
    id: saved.id,
    propertyId: saved.property_id ?? original?.propertyId,
    ownerId: saved.owner_id ?? original?.ownerId,
    tenantId: saved.tenant_id ?? original?.tenantId,
    contractNumber: saved.contract_number ?? original?.contractNumber,
    startDate: saved.start_date ?? original?.startDate,
    endDate: saved.end_date ?? original?.endDate,
    rentValue: saved.rent_value ?? original?.rentValue,
    managementFee: saved.management_fee ?? original?.managementFee,
    dueDay: saved.due_day ?? original?.dueDay,
    adjustmentIndex: saved.adjustment_index ?? original?.adjustmentIndex,
    fees: {
      condo: saved.condo_fee ?? original?.fees?.condo ?? 0,
      tax: saved.tax_fee ?? original?.fees?.tax ?? 0,
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
        const saved = await supabaseDataService.saveOwner({ ...owner, id: '' } as Owner);
        const normalizedOwner = normalizeOwner(saved, owner);

        setOwners(prev => [normalizedOwner, ...prev]);
        return normalizedOwner;
      }

      setOwners(prev => [owner, ...prev]);
      return owner;
    } catch (error: any) {
      alert('ERRO AO SALVAR PROPRIETÁRIO: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO ATUALIZAR PROPRIETÁRIO: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO EXCLUIR PROPRIETÁRIO: ' + (error?.message || JSON.stringify(error)));
      console.error('Erro ao excluir proprietário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, owners, adminContext]);

  const addProperty = useCallback(async (property: Property) => {
    try {
      const status = computePropertyStatus(property, leases);
      const propertyWithStatus = { ...property, status };

      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveProperty({ ...propertyWithStatus, id: '' } as Property);
        const normalizedProperty = normalizeProperty(saved, propertyWithStatus);

        setProperties(prev => [normalizedProperty, ...prev]);
        return normalizedProperty;
      }

      setProperties(prev => [propertyWithStatus, ...prev]);
      return propertyWithStatus;
    } catch (error: any) {
      alert('ERRO AO SALVAR IMÓVEL: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO ATUALIZAR IMÓVEL: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO EXCLUIR IMÓVEL: ' + (error?.message || JSON.stringify(error)));
      console.error('Erro ao excluir imóvel:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, properties, adminContext]);

  const addTenant = useCallback(async (tenant: Tenant) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveTenant({ ...tenant, id: '' } as Tenant);

        setTenants(prev => [saved, ...prev]);
        return saved;
      }

      setTenants(prev => [tenant, ...prev]);
      return tenant;
    } catch (error: any) {
      alert('ERRO AO SALVAR LOCATÁRIO: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO ATUALIZAR LOCATÁRIO: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO EXCLUIR LOCATÁRIO: ' + (error?.message || JSON.stringify(error)));
      console.error('Erro ao excluir locatário:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, tenants, adminContext]);

  const addLease = useCallback(async (lease: Lease) => {
    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveLease({ ...lease, id: '' } as Lease);
        const normalizedLease = normalizeLease(saved, lease);

        setLeases(prev => [normalizedLease, ...prev]);
        return normalizedLease;
      }

      setLeases(prev => [lease, ...prev]);
      return lease;
    } catch (error: any) {
      alert('ERRO AO SALVAR CONTRATO: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO ATUALIZAR CONTRATO: ' + (error?.message || JSON.stringify(error)));
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
    } catch (error: any) {
      alert('ERRO AO EXCLUIR CONTRATO: ' + (error?.message || JSON.stringify(error)));
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
