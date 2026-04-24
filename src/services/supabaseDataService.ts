import { supabase } from '../lib/supabaseClient';
import { Owner, Property, Tenant, Lease, Installment, Transaction, Incident, Inspection, Vendor, AuditLog, SystemUser } from '../types';

export const supabaseDataService = {
  // OWNERS
  async getOwners() {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data.map(o => ({
      ...o,
      bankName: o.bank_info?.bank_name,
      bankAgency: o.bank_info?.agency,
      bankAccount: o.bank_info?.account,
      pixKey: o.bank_info?.pix_key,
      personType: o.bank_info?.person_type,
      companyName: o.bank_info?.company_name,
      stateRegistration: o.bank_info?.state_registration,
      reportPreference: o.bank_info?.report_preference || 'monthly'
    })) as Owner[];
  },

  async saveOwner(owner: Owner) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner.id);
    const payload: any = {
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      document: owner.document,
      address: owner.address,
      bank_info: {
        bank_name: owner.bankName,
        agency: owner.bankAgency,
        account: owner.bankAccount,
        pix_key: owner.pixKey,
        person_type: owner.personType,
        company_name: owner.companyName,
        state_registration: owner.stateRegistration,
        report_preference: owner.reportPreference
      }
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('owners')
        .update(payload)
        .eq('id', owner.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('owners')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteOwner(id: string) {
    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // PROPERTIES
  async getProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*');
    
    if (error) throw error;
    return data.map(p => ({
      ...p,
      ownerId: p.owner_id,
      rentValue: p.rent_value,
      isUnderMaintenance: p.is_under_maintenance
    })) as Property[];
  },

  async saveProperty(property: Property) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.id);
    const isOwnerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.ownerId);

    if (!isOwnerUuid) {
      throw new Error('O proprietário selecionado ainda não possui um ID válido no banco de dados. Por favor, aguarde a sincronização.');
    }

    const payload: any = {
      owner_id: property.ownerId,
      title: property.title,
      address: property.address,
      city: property.city,
      neighborhood: property.neighborhood,
      cep: property.cep,
      type: property.type,
      status: property.status,
      rent_value: property.rentValue,
      is_under_maintenance: property.isUnderMaintenance,
      images: property.images || [],
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', property.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('properties')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteProperty(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // TENANTS
  async getTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Tenant[];
  },

  async saveTenant(tenant: Tenant) {
    const payload: any = {
      id: tenant.id,
      name: tenant.name,
      document: tenant.document,
      email: tenant.email,
      phone: tenant.phone
      // occupation and income are not in the real schema
    };

    try {
      const { data, error } = await supabase
        .from('tenants')
        .upsert(payload)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error saving tenant:', error);
        throw error;
      }
      return data as Tenant;
    } catch (error) {
      console.error('Error in saveTenant:', error);
      throw error;
    }
  },

  async deleteTenant(id: string) {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // LEASES
  async getLeases() {
    const { data, error } = await supabase
      .from('leases')
      .select('*');
    if (error) throw error;
    return data.map(l => ({
      ...l,
      propertyId: l.property_id,
      ownerId: l.owner_id,
      tenantId: l.tenant_id,
      contractNumber: l.contract_number,
      startDate: l.start_date,
      endDate: l.end_date,
      rentValue: l.rent_value,
      managementFee: l.management_fee,
      dueDay: l.due_day,
      adjustmentIndex: l.adjustment_index,
      fees: {
        condo: l.condo_fee,
        tax: l.tax_fee
      }
    })) as Lease[];
  },

  async saveLease(lease: Lease) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lease.id);
    const isPropertyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lease.propertyId);
    const isOwnerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lease.ownerId);
    const isTenantUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lease.tenantId);

    if (!isPropertyUuid || !isOwnerUuid || !isTenantUuid) {
      throw new Error('Imóvel, Proprietário ou Locatário selecionado ainda não possui um ID válido no banco de dados.');
    }

    const payload: any = {
      property_id: lease.propertyId,
      owner_id: lease.ownerId,
      tenant_id: lease.tenantId,
      contract_number: lease.contractNumber,
      start_date: lease.startDate,
      end_date: lease.endDate,
      rent_value: lease.rentValue,
      management_fee: lease.managementFee,
      due_day: lease.dueDay,
      adjustment_index: lease.adjustmentIndex,
      deposit: lease.deposit,
      condo_fee: lease.fees.condo,
      tax_fee: lease.fees.tax,
      status: lease.status,
      observations: lease.observations,
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('leases')
        .update(payload)
        .eq('id', lease.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        propertyId: data.property_id,
        ownerId: data.owner_id,
        tenantId: data.tenant_id,
        contractNumber: data.contract_number,
        startDate: data.start_date,
        endDate: data.end_date,
        rentValue: data.rent_value,
        managementFee: data.management_fee,
        dueDay: data.due_day,
        adjustmentIndex: data.adjustment_index,
        fees: {
          condo: data.condo_fee,
          tax: data.tax_fee
        }
      } as Lease;
    } else {
      const { data, error } = await supabase
        .from('leases')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        propertyId: data.property_id,
        ownerId: data.owner_id,
        tenantId: data.tenant_id,
        contractNumber: data.contract_number,
        startDate: data.start_date,
        endDate: data.end_date,
        rentValue: data.rent_value,
        managementFee: data.management_fee,
        dueDay: data.due_day,
        adjustmentIndex: data.adjustment_index,
        fees: {
          condo: data.condo_fee,
          tax: data.tax_fee
        }
      } as Lease;
    }
  },

  async deleteLease(id: string) {
    const { error } = await supabase
      .from('leases')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // INSTALLMENTS
  async getInstallments() {
    const { data, error } = await supabase
      .from('installments')
      .select('*');
    if (error) throw error;
    return data.map(i => ({
      ...i,
      leaseId: i.lease_id,
      dueDate: i.due_date,
      paidAt: i.paid_at,
      receiptUrl: i.receipt_url,
      agencyFeeValue: i.agency_fee_value,
      agencyFeeStatus: i.agency_fee_status,
      ownerValue: i.owner_value,
      remittanceStatus: i.remittance_status,
      remittanceDate: i.remittance_date,
      remittanceReceiptUrl: i.remittance_receipt_url,
      createdAt: i.created_at
    })) as Installment[];
  },

  async saveInstallment(installment: Installment) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(installment.id);
    const isLeaseUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(installment.leaseId);

    if (!isLeaseUuid) {
      throw new Error('O contrato associado ainda não possui um ID válido no banco de dados.');
    }

    const payload: any = {
      lease_id: installment.leaseId,
      due_date: installment.dueDate,
      value: installment.value,
      status: installment.status,
      paid_at: installment.paidAt,
      receipt_url: installment.receiptUrl,
      agency_fee_value: installment.agencyFeeValue,
      agency_fee_status: installment.agencyFeeStatus,
      owner_value: installment.ownerValue,
      remittance_status: installment.remittanceStatus,
      remittance_date: installment.remittanceDate,
      remittance_receipt_url: installment.remittanceReceiptUrl
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('installments')
        .update(payload)
        .eq('id', installment.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        leaseId: data.lease_id,
        dueDate: data.due_date,
        paidAt: data.paid_at,
        receiptUrl: data.receipt_url,
        agencyFeeValue: data.agency_fee_value,
        agencyFeeStatus: data.agency_fee_status,
        ownerValue: data.owner_value,
        remittanceStatus: data.remittance_status,
        remittanceDate: data.remittance_date,
        remittanceReceiptUrl: data.remittance_receipt_url,
        createdAt: data.created_at
      } as Installment;
    } else {
      const { data, error } = await supabase
        .from('installments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        leaseId: data.lease_id,
        dueDate: data.due_date,
        paidAt: data.paid_at,
        receiptUrl: data.receipt_url,
        agencyFeeValue: data.agency_fee_value,
        agencyFeeStatus: data.agency_fee_status,
        ownerValue: data.owner_value,
        remittanceStatus: data.remittance_status,
        remittanceDate: data.remittance_date,
        remittanceReceiptUrl: data.remittance_receipt_url,
        createdAt: data.created_at
      } as Installment;
    }
  },

  async deleteInstallment(id: string) {
    const { error } = await supabase
      .from('installments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // TRANSACTIONS
  async getTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*');
    if (error) throw error;
    return data.map(t => ({
      ...t,
      propertyId: t.property_id,
      ownerId: t.owner_id,
      relatedId: t.related_id,
      competenceDate: t.competence_date,
      createdAt: t.created_at
    })) as Transaction[];
  },

  async saveTransaction(transaction: Transaction) {
    // Deduplication check: relatedId + category + type + competenceDate
    if (transaction.relatedId && transaction.category && transaction.type && transaction.competenceDate) {
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('related_id', transaction.relatedId)
        .eq('category', transaction.category)
        .eq('type', transaction.type)
        .eq('competence_date', transaction.competenceDate)
        .maybeSingle();

      if (existing) {
        // If we found a match, use its ID to perform an update instead of an insert
        transaction.id = existing.id;
      }
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction.id);
    const isPropertyUuid = transaction.propertyId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction.propertyId) : true;
    const isOwnerUuid = transaction.ownerId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction.ownerId) : true;

    if (!isPropertyUuid || !isOwnerUuid) {
      throw new Error('Imóvel ou Proprietário associado ainda não possui um ID válido no banco de dados.');
    }

    const payload: any = {
      property_id: transaction.propertyId,
      owner_id: transaction.ownerId,
      date: transaction.date,
      description: transaction.description,
      type: transaction.type,
      category: transaction.category,
      value: transaction.value,
      status: transaction.status,
      related_id: transaction.relatedId,
      competence_date: transaction.competenceDate
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', transaction.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // INCIDENTS
  async getIncidents() {
    const { data, error } = await supabase
      .from('incidents')
      .select('*');
    if (error) throw error;
    return data.map(i => ({
      ...i,
      propertyId: i.property_id,
      createdAt: i.created_at,
      updatedAt: i.updated_at
    })) as Incident[];
  },

  async saveIncident(incident: Incident) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incident.id);
    const isPropertyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incident.propertyId);

    if (!isPropertyUuid) {
      throw new Error('O imóvel associado ainda não possui um ID válido no banco de dados.');
    }

    const payload: any = {
      property_id: incident.propertyId,
      description: incident.description,
      status: incident.status,
      category: incident.category
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('incidents')
        .update(payload)
        .eq('id', incident.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('incidents')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteIncident(id: string) {
    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // INSPECTIONS
  async getInspections() {
    const { data, error } = await supabase
      .from('inspections')
      .select('*');
    if (error) throw error;
    return data.map(i => ({
      ...i,
      propertyId: i.property_id,
      createdAt: i.created_at,
      updatedAt: i.updated_at
    })) as Inspection[];
  },

  async saveInspection(inspection: Inspection) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspection.id);
    const isPropertyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspection.propertyId);

    if (!isPropertyUuid) {
      throw new Error('O imóvel associado ainda não possui um ID válido no banco de dados.');
    }

    const payload: any = {
      property_id: inspection.propertyId,
      date: inspection.date,
      type: inspection.type,
      status: inspection.status,
      notes: inspection.summary,
      items: inspection.items
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('inspections')
        .update(payload)
        .eq('id', inspection.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('inspections')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteInspection(id: string) {
    const { error } = await supabase
      .from('inspections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // VENDORS
  async getVendors() {
    const { data, error } = await supabase
      .from('vendors')
      .select('*');
    if (error) throw error;
    return data.map(v => ({
      ...v,
      createdAt: v.created_at,
      updatedAt: v.updated_at
    })) as Vendor[];
  },

  async saveVendor(vendor: Vendor) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendor.id);
    const payload: any = {
      name: vendor.name,
      service: vendor.service,
      contact: vendor.contact,
      phone: vendor.phone,
      email: vendor.email,
      city: vendor.city,
      rating: vendor.rating,
      skills: vendor.skills
    };

    if (isUuid) {
      const { data, error } = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', vendor.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('vendors')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteVendor(id: string) {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // AUDIT LOGS
  async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as AuditLog[];
  },

  async saveAuditLog(log: AuditLog) {
    const payload = {
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      table_name: log.table_name,
      record_id: log.record_id,
      old_data: log.old_data,
      new_data: log.new_data
    };
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // SYSTEM USERS / PROFILES
  async getProfiles() {
    try {
      const response = await fetch('/api/users/list');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        username: p.username,
        role: p.role === 'user' ? 'staff' : p.role,
        permissions: p.permissions || []
      })) as SystemUser[];
    } catch (error) {
      console.error('Error fetching profiles from server:', error);
      throw error;
    }
  },

  async createSystemUser(user: Omit<SystemUser, 'id'> & { email: string; password?: string }) {
    // Call the secure endpoint on our server
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        name: user.name,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create user');
    }

    return {
      id: result.profile.id,
      name: result.profile.name,
      username: result.profile.username,
      role: result.profile.role === 'user' ? 'staff' : result.profile.role,
      permissions: result.profile.permissions
    } as SystemUser;
  },

  async updateProfile(user: SystemUser) {
    try {
      const response = await fetch(`/api/users/update/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.name,
          username: user.username,
          role: user.role,
          permissions: user.permissions
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user');

      return {
        id: data.id,
        name: data.name,
        username: data.username,
        role: data.role === 'user' ? 'staff' : data.role,
        permissions: data.permissions
      } as SystemUser;
    } catch (error) {
      console.error('Error updating profile via server:', error);
      throw error;
    }
  },

  async deleteProfile(id: string) {
    try {
      const response = await fetch(`/api/users/delete/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting profile via server:', error);
      throw error;
    }
  },

  async getProfileByUsername(username: string) {
    // We need to resolve username to email via our secure server endpoint
    // since email is not in the profiles table anymore
    try {
      const response = await fetch(`/api/users/get-email/${username}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.email || null;
    } catch (error) {
      console.error('Error resolving username to email:', error);
      return null;
    }
  }
};



