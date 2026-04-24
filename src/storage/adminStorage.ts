import { SystemUser, AuditLog } from '../types';
import { storage } from './base';
import { STORAGE_KEYS } from '../config/storageKeys';

const KEY = STORAGE_KEYS.ADMIN;

export const adminStorage = {
  get: () => {
    const data = storage.get(KEY, { systemUsers: [], auditLogs: [] });
    return {
      systemUsers: Array.isArray(data?.systemUsers) ? data.systemUsers : [],
      auditLogs: Array.isArray(data?.auditLogs) ? data.auditLogs : [],
    };
  },
  save: (data: { systemUsers: SystemUser[], auditLogs: AuditLog[] }) => {
    storage.set(KEY, data);
  }
};
