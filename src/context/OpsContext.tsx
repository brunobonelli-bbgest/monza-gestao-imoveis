import React, { createContext, useState, useCallback, useMemo, useEffect, ReactNode, useContext } from 'react';
import { Incident, Inspection, Vendor } from '../types';
import { opsStorage } from '../storage/opsStorage';
import { AdminContext } from './AdminContext';
import { AuthContext } from '../auth/AuthProvider';
import { auditService } from '../services/auditService';
import { supabaseDataService } from '../services/supabaseDataService';

export interface OpsContextType {
  incidents: Incident[];
  inspections: Inspection[];
  vendors: Vendor[];
  loading: boolean;
  addIncident: (incident: Incident) => Promise<void>;
  updateIncident: (incident: Incident) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
  addInspection: (inspection: Inspection) => Promise<void>;
  updateInspection: (inspection: Inspection) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;
  deleteInspectionWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  addVendor: (vendor: Vendor) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  deleteVendorWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  deleteIncidentWithAudit: (id: string, details: string, justification: string) => Promise<void>;
}

export const OpsContext = createContext<OpsContextType | undefined>(undefined);

export const OpsProvider = ({ children }: { children: ReactNode }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
          const [sIncidents, sInspections, sVendors] = await Promise.all([
            supabaseDataService.getIncidents().catch(e => { console.error('[Ops] Error fetching incidents:', e); throw e; }),
            supabaseDataService.getInspections().catch(e => { console.error('[Ops] Error fetching inspections:', e); throw e; }),
            supabaseDataService.getVendors().catch(e => { console.error('[Ops] Error fetching vendors:', e); throw e; })
          ]);
          
          if (isMounted) {
            setIncidents(sIncidents);
            setInspections(sInspections);
            setVendors(sVendors);
          }
        } else if (!auth.loading) {
          const localData = opsStorage.get();
          if (isMounted) {
            setIncidents(localData.incidents);
            setInspections(localData.inspections);
            setVendors(localData.vendors);
          }
        }
      } catch (error) {
        console.error('[OpsContext] Critical error loading data:', error);
        if (isMounted) {
          const localData = opsStorage.get();
          setIncidents(localData.incidents);
          setInspections(localData.inspections);
          setVendors(localData.vendors);
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
      opsStorage.save({ incidents, inspections, vendors });
    }
  }, [incidents, inspections, vendors, loading]);

  const addIncident = useCallback(async (incident: Incident) => {
    const now = new Date().toISOString();
    const incidentWithTimestamps = {
      ...incident,
      createdAt: incident.createdAt || now
    };

    // Optimistic update
    setIncidents(prev => {
      const exists = prev.some(i => i.id === incidentWithTimestamps.id);
      return exists ? prev.map(i => i.id === incidentWithTimestamps.id ? incidentWithTimestamps : i) : [incidentWithTimestamps, ...prev];
    });

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveIncident(incidentWithTimestamps);
        if (saved && saved.id !== incidentWithTimestamps.id) {
          setIncidents(prev => prev.map(i => i.id === incidentWithTimestamps.id ? { ...i, id: saved.id } : i));
        }
      }
    } catch (error) {
      console.error('Error adding incident:', error);
    }
  }, [auth?.isAuthenticated]);

  const updateIncident = useCallback(async (incident: Incident) => {
    const now = new Date().toISOString();
    const incidentWithTimestamps = {
      ...incident
    };

    // Optimistic update
    setIncidents(prev => prev.map(i => i.id === incidentWithTimestamps.id ? incidentWithTimestamps : i));

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveIncident(incidentWithTimestamps);
        if (saved && saved.id !== incidentWithTimestamps.id) {
          setIncidents(prev => prev.map(i => i.id === incidentWithTimestamps.id ? { ...i, id: saved.id } : i));
        }
      }
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  }, [auth?.isAuthenticated]);

  const deleteIncident = useCallback(async (id: string) => {
    try {
      const incidentToDelete = incidents.find(i => i.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteIncident(id);

        // Audit Log
        if (adminContext?.addAuditLog && incidentToDelete) {
          const log = auditService.createLog('DELETE', 'incidents', id, incidentToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setIncidents(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting incident:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, incidents, adminContext]);

  const addInspection = useCallback(async (inspection: Inspection) => {
    const now = new Date().toISOString();
    const inspectionWithTimestamps = {
      ...inspection,
      createdAt: inspection.createdAt || now
    };

    // Optimistic update
    setInspections(prev => {
      const exists = prev.some(i => i.id === inspectionWithTimestamps.id);
      return exists ? prev.map(i => i.id === inspectionWithTimestamps.id ? inspectionWithTimestamps : i) : [inspectionWithTimestamps, ...prev];
    });

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveInspection(inspectionWithTimestamps);
        if (saved && saved.id !== inspectionWithTimestamps.id) {
          setInspections(prev => prev.map(i => i.id === inspectionWithTimestamps.id ? { ...i, id: saved.id } : i));
        }
      }
    } catch (error) {
      console.error('Error adding inspection:', error);
    }
  }, [auth?.isAuthenticated]);

  const updateInspection = useCallback(async (inspection: Inspection) => {
    const now = new Date().toISOString();
    const inspectionWithTimestamps = {
      ...inspection
    };

    // Optimistic update
    setInspections(prev => prev.map(i => i.id === inspectionWithTimestamps.id ? inspectionWithTimestamps : i));

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveInspection(inspectionWithTimestamps);
        if (saved && saved.id !== inspectionWithTimestamps.id) {
          setInspections(prev => prev.map(i => i.id === inspectionWithTimestamps.id ? { ...i, id: saved.id } : i));
        }
      }
    } catch (error) {
      console.error('Error updating inspection:', error);
    }
  }, [auth?.isAuthenticated]);

  const deleteInspection = useCallback(async (id: string) => {
    try {
      const inspectionToDelete = inspections.find(i => i.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteInspection(id);

        // Audit Log
        if (adminContext?.addAuditLog && inspectionToDelete) {
          const log = auditService.createLog('DELETE', 'inspections', id, inspectionToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setInspections(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting inspection:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, inspections, adminContext]);

  const addVendor = useCallback(async (vendor: Vendor) => {
    const now = new Date().toISOString();
    const vendorWithTimestamps = {
      ...vendor,
      createdAt: vendor.createdAt || now
    };

    // Optimistic update
    setVendors(prev => {
      const exists = prev.some(v => v.id === vendorWithTimestamps.id);
      return exists ? prev.map(v => v.id === vendorWithTimestamps.id ? vendorWithTimestamps : v) : [vendorWithTimestamps, ...prev];
    });

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveVendor(vendorWithTimestamps);
        if (saved && saved.id !== vendorWithTimestamps.id) {
          setVendors(prev => prev.map(v => v.id === vendorWithTimestamps.id ? { ...v, id: saved.id } : v));
        }
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  }, [auth?.isAuthenticated]);

  const updateVendor = useCallback(async (vendor: Vendor) => {
    const now = new Date().toISOString();
    const vendorWithTimestamps = {
      ...vendor
    };

    // Optimistic update
    setVendors(prev => prev.map(v => v.id === vendorWithTimestamps.id ? vendorWithTimestamps : v));

    try {
      if (auth?.isAuthenticated) {
        const saved = await supabaseDataService.saveVendor(vendorWithTimestamps);
        if (saved && saved.id !== vendorWithTimestamps.id) {
          setVendors(prev => prev.map(v => v.id === vendorWithTimestamps.id ? { ...v, id: saved.id } : v));
        }
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
    }
  }, [auth?.isAuthenticated]);

  const deleteVendor = useCallback(async (id: string) => {
    try {
      const vendorToDelete = vendors.find(v => v.id === id);
      if (auth?.isAuthenticated) {
        await supabaseDataService.deleteVendor(id);

        // Audit Log
        if (adminContext?.addAuditLog && vendorToDelete) {
          const log = auditService.createLog('DELETE', 'vendors', id, vendorToDelete, null, auth.user?.id);
          await adminContext.addAuditLog(log);
        }
      }
      
      // Update state only after success
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  }, [auth?.isAuthenticated, auth?.user?.id, vendors, adminContext]);

  const deleteIncidentWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    // Just call deleteIncident which now has audit
    await deleteIncident(id);
  }, [deleteIncident]);

  const deleteInspectionWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    await deleteInspection(id);
  }, [deleteInspection]);

  const deleteVendorWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    await deleteVendor(id);
  }, [deleteVendor]);

  const value = useMemo(() => ({
    incidents, inspections, vendors, loading,
    addIncident, updateIncident, deleteIncident, deleteIncidentWithAudit,
    addInspection, updateInspection, deleteInspection, deleteInspectionWithAudit,
    addVendor, updateVendor, deleteVendor, deleteVendorWithAudit
  }), [
    incidents, inspections, vendors, loading,
    addIncident, updateIncident, deleteIncident, deleteIncidentWithAudit,
    addInspection, updateInspection, deleteInspection, deleteInspectionWithAudit,
    addVendor, updateVendor, deleteVendor, deleteVendorWithAudit
  ]);

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
};

