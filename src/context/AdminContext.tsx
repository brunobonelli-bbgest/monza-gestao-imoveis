import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { SystemUser, AuditLog } from '../types';
import { adminStorage } from '../storage/adminStorage';
import { AuthContext } from '../auth/AuthProvider';
import { supabaseDataService } from '../services/supabaseDataService';
import { auditService } from '../services/auditService';

export interface AdminContextType {
  systemUsers: SystemUser[];
  auditLogs: AuditLog[];
  loading: boolean;
  addSystemUser: (user: Omit<SystemUser, 'id'> & { email: string; password?: string }) => Promise<SystemUser>;
  updateSystemUser: (user: SystemUser) => Promise<void>;
  deleteSystemUser: (id: string) => Promise<void>;
  deleteSystemUserWithAudit: (id: string, details: string, justification: string) => Promise<void>;
  addAuditLog: (log: AuditLog) => Promise<void>;
  clearAuditLogs: () => void;
  refreshData: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = useContext(AuthContext);

  const loadData = useCallback(async () => {
    if (!auth || auth.loading) return;

    setLoading(true);
    try {
      if (auth.isAuthenticated && auth.user) {
        console.log('[AdminContext] Fetching data from Supabase...');
        const [sLogs, sUsers] = await Promise.all([
          supabaseDataService.getAuditLogs().catch(e => { console.error('[Admin] Error fetching audit logs:', e); return []; }),
          supabaseDataService.getProfiles().catch(e => { console.error('[Admin] Error fetching profiles:', e); return []; })
        ]);
        
        console.log(`[AdminContext] Loaded ${sUsers.length} users from Supabase`);
        setAuditLogs(sLogs);
        setSystemUsers(sUsers);
      } else if (!auth.loading) {
        const localData = adminStorage.get();
        setSystemUsers(localData.systemUsers);
        setAuditLogs(localData.auditLogs);
      }
    } catch (error) {
      console.error('[AdminContext] Critical error loading data:', error);
      const localData = adminStorage.get();
      setSystemUsers(localData.systemUsers);
      setAuditLogs(localData.auditLogs);
    } finally {
      setLoading(false);
    }
  }, [auth?.isAuthenticated, auth?.loading, auth?.user?.id]);

  // Load data from Supabase or LocalStorage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save to LocalStorage as backup
  useEffect(() => {
    if (!loading) {
      adminStorage.save({ systemUsers, auditLogs });
    }
  }, [systemUsers, auditLogs, loading]);

  const addSystemUser = useCallback(async (user: Omit<SystemUser, 'id'> & { email: string; password?: string }) => {
    try {
      const newUser = await supabaseDataService.createSystemUser(user);
      // Refresh the entire list to ensure consistency with the server
      const sUsers = await supabaseDataService.getProfiles();
      setSystemUsers(sUsers);
      return newUser;
    } catch (error) {
      console.error('Error adding system user:', error);
      throw error;
    }
  }, []);

  const updateSystemUser = useCallback(async (user: SystemUser) => {
    try {
      const updatedUser = await supabaseDataService.updateProfile(user);
      setSystemUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    } catch (error) {
      console.error('Error updating system user:', error);
      throw error;
    }
  }, []);

  const addAuditLog = useCallback(async (log: AuditLog) => {
    try {
      if (auth?.isAuthenticated) {
        await supabaseDataService.saveAuditLog(log);
      }
      setAuditLogs(prev => [log, ...prev]);
    } catch (error) {
      console.error('Error adding audit log:', error);
    }
  }, [auth?.isAuthenticated]);

  const deleteSystemUser = useCallback(async (id: string) => {
    try {
      await supabaseDataService.deleteProfile(id);
      setSystemUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error deleting system user:', error);
      throw error;
    }
  }, []);

  const deleteSystemUserWithAudit = useCallback(async (id: string, details: string, justification: string) => {
    const user = systemUsers.find(u => u.id === id);
    const log = auditService.createLog('delete_system_user', 'system_users', id, user, { details, justification }, auth?.user?.id);
    await addAuditLog(log);
    await deleteSystemUser(id);
  }, [addAuditLog, deleteSystemUser, systemUsers, auth?.user?.id]);

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
  }, []);

  const value = useMemo(() => ({
    systemUsers, auditLogs, loading, addSystemUser, updateSystemUser, deleteSystemUser, deleteSystemUserWithAudit, addAuditLog, clearAuditLogs, refreshData: loadData
  }), [systemUsers, auditLogs, loading, addSystemUser, updateSystemUser, deleteSystemUser, deleteSystemUserWithAudit, addAuditLog, clearAuditLogs, loadData]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

