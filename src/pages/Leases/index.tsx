import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Home, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download,
  Mail,
  MoreHorizontal,
  Trash2,
  Edit,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Receipt,
  Printer
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { cn } from '../../utils/cn';
import { Lease, Installment } from '../../types';
import { useData } from '../../context/DataContext';

export const LeasesList = () => {
  const { 
    leases, addLease, updateLease, deleteLease, deleteLeaseWithAudit,
    properties, tenants, owners, updateProperty, 
    installments, updateInstallment, receiveInstallment, revertInstallmentReceipt, addInstallments, addInstallment, deleteInstallment, deleteInstallmentWithAudit,
    addTransaction, deleteTransaction, addAuditLog
  } = useData();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'active' | 'no-contract' | 'history'>('active');
  const [statusFilter, setStatusFilter] = useState('Todos os Status');
  const [selectedLeaseForFinance, setSelectedLeaseForFinance] = useState<Lease | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isAddInstallmentModalOpen, setIsAddInstallmentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelObservation, setCancelObservation] = useState('');
  const [installmentToCancel, setInstallmentToCancel] = useState<Installment | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [newInstallmentData, setNewInstallmentData] = useState({
    dueDate: '',
    value: '',
    status: 'pending' as const,
    agencyFeeValue: '',
    agencyFeeStatus: 'pending' as const,
    remittanceStatus: 'pending' as const
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status === 'overdue') {
      setStatusFilter('Vencidos');
    }

    const leaseId = params.get('id');
    if (leaseId) {
      const lease = leases.find(l => l.id === leaseId);
      if (lease) {
        setEditingLease(lease);
        setIsModalOpen(true);
      }
    }
  }, [location, leases]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteInstallmentModalOpen, setIsDeleteInstallmentModalOpen] = useState(false);
  const [isRescindModalOpen, setIsRescindModalOpen] = useState(false);
  const [leaseToDelete, setLeaseToDelete] = useState<string | null>(null);
  const [installmentToDelete, setInstallmentToDelete] = useState<Installment | null>(null);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [leaseToRescind, setLeaseToRescind] = useState<Lease | null>(null);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [isReadjustModalOpen, setIsReadjustModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInstallmentForReceipt, setSelectedInstallmentForReceipt] = useState<Installment | null>(null);
  const [readjustData, setReadjustData] = useState({
    newValue: '',
    startDate: '',
    months: '12'
  });
  
  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentValue: '',
    adjustmentIndex: 'IPCA',
    dueDay: '10',
    condoFee: '0',
    taxFee: '0',
    deposit: '0',
    managementFee: '5',
    installmentsCount: '12',
    observations: ''
  });

  useEffect(() => {
    if (properties.length > 0 && !editingLease && !formData.propertyId) {
      setFormData(prev => ({ ...prev, propertyId: properties[0].id }));
    }
    if (tenants.length > 0 && !editingLease && !formData.tenantId) {
      setFormData(prev => ({ ...prev, tenantId: tenants[0].id }));
    }
  }, [properties, tenants, editingLease]);

  useEffect(() => {
    if (editingLease) {
      setFormData({
        propertyId: editingLease.propertyId,
        tenantId: editingLease.tenantId,
        startDate: editingLease.startDate,
        endDate: editingLease.endDate,
        rentValue: editingLease.rentValue.toString(),
        adjustmentIndex: editingLease.adjustmentIndex,
        dueDay: editingLease.dueDay.toString(),
        condoFee: editingLease.fees.condo.toString(),
        taxFee: editingLease.fees.tax.toString(),
        deposit: editingLease.deposit.toString(),
        managementFee: (editingLease.managementFee || 5).toString(),
        installmentsCount: installments.filter(i => i.leaseId === editingLease.id).length.toString() || '12',
        observations: editingLease.observations || ''
      });
    } else {
      setFormData({
        propertyId: properties.length > 0 ? properties[0].id : '',
        tenantId: tenants.length > 0 ? tenants[0].id : '',
        startDate: '',
        endDate: '',
        rentValue: '',
        adjustmentIndex: 'IPCA',
        dueDay: '10',
        condoFee: '0',
        taxFee: '0',
        deposit: '0',
        managementFee: '5',
        installmentsCount: '12',
        observations: ''
      });
    }
  }, [editingLease, properties, tenants]);

  // Auto-update overdue status
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasChanges = false;
    installments.forEach(inst => {
      if (inst.status === 'pending') {
        const dueDate = parseLocalDate(inst.dueDate);
        if (dueDate < today) {
          updateInstallment({
            ...inst,
            status: 'overdue'
          });
          hasChanges = true;
        }
      }
    });
  }, [installments.length]); // Only run when count changes or on mount to avoid loops

  const generateContractNumber = () => {
    const lastNumbers = leases
      .map(l => {
        if (!l.contractNumber) return 0;
        const parts = l.contractNumber.split('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        return isNaN(num) ? 0 : num;
      })
      .filter(n => n > 0);
    
    const nextNumber = lastNumbers.length > 0 ? Math.max(...lastNumbers) + 1 : 1;
    const year = new Date().getFullYear();
    return `${year}-${nextNumber.toString().padStart(4, '0')}`;
  };

  const parseLocalDate = (dateString: string) => {
    if (!dateString) return new Date();
    // Handle YYYY-MM-DD format
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day || 1);
    }
    return new Date(dateString);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = parseLocalDate(dateString);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return date.toLocaleDateString('pt-BR');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validations
    if (!formData.propertyId || !formData.tenantId || !formData.startDate || !formData.endDate || !formData.rentValue) {
      setFormError("Por favor, preencha todos os campos obrigatórios (Imóvel, Locatário, Datas e Valor).");
      return;
    }

    const updatedRentValue = Number(formData.rentValue);
    if (updatedRentValue <= 0) {
      setFormError("O valor do aluguel deve ser maior que zero.");
      return;
    }

    // Check for existing active lease for the same property
    const duplicateLease = leases.find(l => 
      l.propertyId === formData.propertyId && 
      l.status === 'active' && 
      l.id !== editingLease?.id
    );

    if (duplicateLease) {
      setFormError("Este imóvel já possui um contrato ativo. Encerre o contrato anterior antes de criar um novo.");
      return;
    }

    const property = properties.find(p => p.id === formData.propertyId);
    if (!property) return;

    try {
      if (editingLease) {
        await updateLease({
          ...editingLease,
          propertyId: formData.propertyId,
          ownerId: property.ownerId,
          tenantId: formData.tenantId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          rentValue: updatedRentValue,
          adjustmentIndex: formData.adjustmentIndex,
          deposit: Number(formData.deposit),
          dueDay: Number(formData.dueDay),
          fees: {
            condo: Number(formData.condoFee),
            tax: Number(formData.taxFee)
          },
          managementFee: Number(formData.managementFee),
          observations: formData.observations
        });
        
        // Update property rent value and status
        await updateProperty({
          ...property,
          rentValue: updatedRentValue,
          status: 'rented'
        });
      } else {
        const lease: Lease = {
          id: `l${Date.now()}`,
          contractNumber: generateContractNumber(),
          propertyId: formData.propertyId,
          ownerId: property.ownerId,
          tenantId: formData.tenantId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          rentValue: updatedRentValue,
          adjustmentIndex: formData.adjustmentIndex,
          deposit: Number(formData.deposit),
          dueDay: Number(formData.dueDay),
          fees: {
            condo: Number(formData.condoFee),
            tax: Number(formData.taxFee)
          },
          status: 'active',
          managementFee: Number(formData.managementFee),
          observations: formData.observations
        };
        const savedLease = await addLease(lease);
        await handleGenerateInstallments(savedLease, Number(formData.installmentsCount));

        // Update property rent value and status
        await updateProperty({
          ...property,
          rentValue: updatedRentValue,
          status: 'rented'
        });
      }

      setIsModalOpen(false);
      setEditingLease(null);
    } catch (error) {
      console.error('Error saving lease flow:', error);
      setFormError("Erro ao salvar contrato e gerar parcelas. Verifique sua conexão.");
    }
  };

  const confirmDelete = (id: string) => {
    setLeaseToDelete(id);
    setDeleteJustification('');
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (leaseToDelete) {
      const lease = leases.find(l => l.id === leaseToDelete);
      const property = properties.find(p => p.id === lease?.propertyId);
      const leaseInsts = installments.filter(i => i.leaseId === leaseToDelete);
      const totalValue = leaseInsts.reduce((acc, i) => acc + i.value, 0);
      const details = `Contrato: ${lease?.contractNumber || lease?.id} - Imóvel: ${property?.title || 'N/A'} | Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Total de Parcelas: ${leaseInsts.length}`;
      
      deleteLeaseWithAudit(leaseToDelete, details, deleteJustification);
      
      setIsDeleteModalOpen(false);
      setLeaseToDelete(null);
      setDeleteJustification('');
    }
  };

  const confirmRescind = (lease: Lease) => {
    setLeaseToRescind(lease);
    setIsRescindModalOpen(true);
  };

  const handleRescind = () => {
    if (leaseToRescind) {
      // 1. Update Lease Status
      updateLease({
        ...leaseToRescind,
        status: 'terminated'
      });

      // 2. Update Property Status to Vacant
      const property = properties.find(p => p.id === leaseToRescind.propertyId);
      if (property) {
        updateProperty({
          ...property,
          status: 'vacant'
        });
      }

      setIsRescindModalOpen(false);
      setLeaseToRescind(null);
    }
  };

  const openEditModal = (lease: Lease) => {
    setEditingLease(lease);
    setIsModalOpen(true);
  };

  const openFinanceModal = (lease: Lease) => {
    setSelectedLeaseForFinance(lease);
    setIsFinanceModalOpen(true);
  };

  const handleTogglePayment = (installmentId: string) => {
    const installment = installments.find(i => i.id === installmentId);
    if (!installment) return;

    const isCurrentlyPaid = installment.status === 'paid';
    
    if (isCurrentlyPaid) {
      // Show confirmation modal for cancellation
      setInstallmentToCancel(installment);
      setCancelObservation('');
      setIsCancelModalOpen(true);
      return;
    }

    // Mark as paid
    receiveInstallment(installmentId, new Date().toISOString(), 'Recebimento de aluguel via lista de contratos');
  };

  const handleConfirmCancel = () => {
    if (!installmentToCancel) return;

    revertInstallmentReceipt(installmentToCancel.id, cancelObservation || 'Cancelamento de pagamento');
    
    setIsCancelModalOpen(false);
    setInstallmentToCancel(null);
    setCancelObservation('');
  };

  const handleGenerateInstallments = async (lease: Lease, count?: number) => {
    try {
      const start = parseLocalDate(lease.startDate);
      const end = parseLocalDate(lease.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Use provided count or calculate from dates
      let months = count;
      if (!months || isNaN(months)) {
        months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      }
      if (months <= 0) months = 1;

      const leaseId = lease.id;
      const newInstallments: Installment[] = [];
      let monthOffset = 0;

      for (let i = 0; i < months; i++) {
        let currentMonth = new Date(start.getFullYear(), start.getMonth() + monthOffset, lease.dueDay);
        
        // If the calculated due date is before the contract start date, move to next month
        if (currentMonth < start) {
          monthOffset++;
          currentMonth = new Date(start.getFullYear(), start.getMonth() + monthOffset, lease.dueDay);
        }

        // Respect end date strictly
        if (currentMonth > end) break;
        
        const totalValue = lease.rentValue + lease.fees.condo + lease.fees.tax;
        const agencyFee = (totalValue * (lease.managementFee || 5)) / 100;
        const ownerValue = totalValue - agencyFee;

        const property = properties.find(p => p.id === lease.propertyId);
        const owner = owners.find(o => o.id === lease.ownerId);

        newInstallments.push({
          id: `inst-${leaseId}-${i}-${Date.now()}`,
          leaseId: leaseId,
          dueDate: currentMonth.toISOString().split('T')[0],
          value: totalValue,
          status: (currentMonth < today ? 'overdue' : 'pending') as any,
          agencyFeeValue: agencyFee,
          agencyFeeStatus: 'pending' as any,
          ownerValue: ownerValue,
          remittanceStatus: 'pending' as any,
          propertyTitle: property?.title,
          ownerName: owner?.name
        });

        monthOffset++;
      }
      
      if (newInstallments.length > 0) {
        await addInstallments(newInstallments);
      }
    } catch (error) {
      console.error('Error generating installments:', error);
      throw error;
    }
  };

  const handleAddManualInstallment = () => {
    if (!selectedLeaseForFinance) return;
    
    const totalValue = Number(newInstallmentData.value);
    const agencyFee = Number(newInstallmentData.agencyFeeValue) || (totalValue * (selectedLeaseForFinance.managementFee || 10)) / 100;
    const ownerValue = totalValue - agencyFee;

    const finalStatus = newInstallmentData.status as any;
    // Force collected if paid, otherwise keep pending
    const finalAgencyFeeStatus = (finalStatus === 'paid' ? 'collected' : 'pending') as any;
    const finalRemittanceStatus = editingInstallment ? editingInstallment.remittanceStatus : 'pending' as any;

    const property = properties.find(p => p.id === selectedLeaseForFinance.propertyId);
    const owner = owners.find(o => o.id === selectedLeaseForFinance.ownerId);

    const installmentData = {
      dueDate: newInstallmentData.dueDate,
      value: totalValue,
      status: finalStatus,
      agencyFeeValue: agencyFee,
      agencyFeeStatus: finalAgencyFeeStatus,
      ownerValue: ownerValue,
      remittanceStatus: finalRemittanceStatus,
      paidAt: finalStatus === 'paid' ? (editingInstallment?.paidAt || new Date().toISOString()) : undefined,
      propertyTitle: property?.title,
      ownerName: owner?.name
    };

    let targetInst: Installment;

    if (editingInstallment) {
      targetInst = { ...editingInstallment, ...installmentData };
      updateInstallment(targetInst, {
        action: 'update_installment',
        justification: 'Edição manual de parcela'
      });
    } else {
      targetInst = {
        id: `inst-manual-${Date.now()}`,
        leaseId: selectedLeaseForFinance.id,
        ...installmentData
      };
      addInstallment(targetInst);
    }

    setIsAddInstallmentModalOpen(false);
    setEditingInstallment(null);
    setNewInstallmentData({ 
      dueDate: '', 
      value: '', 
      status: 'pending', 
      agencyFeeValue: '', 
      agencyFeeStatus: 'pending',
      remittanceStatus: 'pending'
    });
  };

  const openEditInstallmentModal = (inst: Installment) => {
    setEditingInstallment(inst);
    setNewInstallmentData({
      dueDate: inst.dueDate,
      value: inst.value.toString(),
      status: inst.status as any,
      agencyFeeValue: inst.agencyFeeValue.toString(),
      agencyFeeStatus: inst.agencyFeeStatus as any,
      remittanceStatus: inst.remittanceStatus as any
    });
    setIsAddInstallmentModalOpen(true);
  };

  const handleReadjustment = () => {
    if (!selectedLeaseForFinance) return;
    
    const start = parseLocalDate(readjustData.startDate);
    const months = parseInt(readjustData.months);
    const newValue = parseFloat(readjustData.newValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(newValue) || isNaN(months) || !readjustData.startDate) {
      alert("Preencha todos os campos do reajuste.");
      return;
    }

    const newInstallments = [];
    for (let i = 0; i < months; i++) {
      const dueDate = new Date(start.getFullYear(), start.getMonth() + i, selectedLeaseForFinance.dueDay);
      
      const totalValue = newValue + selectedLeaseForFinance.fees.condo + selectedLeaseForFinance.fees.tax;
      const agencyFee = (totalValue * (selectedLeaseForFinance.managementFee || 10)) / 100;
      const ownerValue = totalValue - agencyFee;

      newInstallments.push({
        id: `inst-readjust-${selectedLeaseForFinance.id}-${i}-${Date.now()}`,
        leaseId: selectedLeaseForFinance.id,
        dueDate: dueDate.toISOString().split('T')[0],
        value: totalValue,
        status: (dueDate < today ? 'overdue' : 'pending') as any,
        agencyFeeValue: agencyFee,
        agencyFeeStatus: 'pending' as any,
        ownerValue: ownerValue,
        remittanceStatus: 'pending' as any
      });
    }
    
    addInstallments(newInstallments);
    setIsReadjustModalOpen(false);
  };

  const handleDeleteInstallment = () => {
    if (installmentToDelete) {
      const lease = leases.find(l => l.id === installmentToDelete.leaseId);
      const property = properties.find(p => p.id === lease?.propertyId);
      const details = `Parcela: ${installmentToDelete.dueDate} - ${property?.title || 'N/A'} | Valor: R$ ${installmentToDelete.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      
      deleteInstallmentWithAudit(installmentToDelete.id, details, deleteJustification);
      
      setIsDeleteInstallmentModalOpen(false);
      setInstallmentToDelete(null);
      setDeleteJustification('');
    }
  };

  const confirmDeleteInstallment = (inst: Installment) => {
    setInstallmentToDelete(inst);
    setDeleteJustification('');
    setIsDeleteInstallmentModalOpen(true);
  };

  const leaseInstallments = selectedLeaseForFinance 
    ? installments.filter(i => i.leaseId === selectedLeaseForFinance.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : [];

  const financialSummary = selectedLeaseForFinance ? {
    totalExpected: leaseInstallments.reduce((acc, i) => acc + i.value, 0),
    totalReceived: leaseInstallments.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.value, 0),
    totalAgency: leaseInstallments.filter(i => i.agencyFeeStatus === 'collected').reduce((acc, i) => acc + i.agencyFeeValue, 0),
    totalOwner: leaseInstallments.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.ownerValue, 0),
    totalRepassed: leaseInstallments.filter(i => i.remittanceStatus === 'completed').reduce((acc, i) => acc + i.ownerValue, 0),
  } : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos de Locação</h1>
          <p className="text-slate-500">Gerencie os contratos ativos, vencimentos e financeiro.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Novo Contrato
        </Button>
      </div>

      {/* Rescind Confirmation Modal */}
      <Modal
        isOpen={isRescindModalOpen}
        onClose={() => setIsRescindModalOpen(false)}
        title="Rescindir Contrato"
        className="z-[200]"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRescindModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleRescind} className="bg-amber-600 hover:bg-amber-700 text-white">Rescindir</Button>
          </div>
        }
      >
        <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <XCircle size={24} />
          </div>
          <div>
            <h4 className="font-bold text-amber-900">Rescisão de Contrato</h4>
            <p className="text-sm text-amber-700 mt-1">
              Ao rescindir o contrato, ele será marcado como <strong>Terminado</strong> e o imóvel ficará <strong>Vago</strong> e disponível para novas locações. Todo o histórico financeiro será preservado.
            </p>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingLease(null); }} 
        title={editingLease ? "Editar Contrato" : "Criar Novo Contrato"}
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingLease(null); setFormError(null); }}>Cancelar</Button>
            <Button onClick={handleSave}>{editingLease ? "Salvar Alterações" : "Criar Contrato"}</Button>
          </>
        }
      >
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-in slide-in-from-top-2">
            <AlertTriangle size={16} />
            <span className="font-medium">{formError}</span>
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Imóvel</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.propertyId}
                onChange={e => setFormData({...formData, propertyId: e.target.value})}
                required
              >
                <option value="" disabled>Selecione um imóvel</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Locatário</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.tenantId}
                onChange={e => setFormData({...formData, tenantId: e.target.value})}
                required
              >
                <option value="" disabled>Selecione um locatário</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Data Início</label>
              <Input 
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Data Fim</label>
              <Input 
                type="date" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Valor Aluguel</label>
              <Input 
                type="number" 
                placeholder="R$ 0,00" 
                value={formData.rentValue}
                onChange={e => setFormData({...formData, rentValue: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Dia Vencimento</label>
              <Input 
                type="number" 
                placeholder="10" 
                value={formData.dueDay}
                onChange={e => setFormData({...formData, dueDay: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Reajuste</label>
              <Input 
                placeholder="IPCA" 
                value={formData.adjustmentIndex}
                onChange={e => setFormData({...formData, adjustmentIndex: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Condomínio</label>
              <Input 
                type="number" 
                placeholder="R$ 0,00" 
                value={formData.condoFee}
                onChange={e => setFormData({...formData, condoFee: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">IPTU</label>
              <Input 
                type="number" 
                placeholder="R$ 0,00" 
                value={formData.taxFee}
                onChange={e => setFormData({...formData, taxFee: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Caução/Garantia</label>
              <Input 
                type="number" 
                placeholder="R$ 0,00" 
                value={formData.deposit}
                onChange={e => setFormData({...formData, deposit: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Taxa Adm (%)</label>
              <Input 
                type="number" 
                placeholder="10" 
                value={formData.managementFee}
                onChange={e => setFormData({...formData, managementFee: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Qtd. Parcelas</label>
              <Input 
                type="number" 
                placeholder="12" 
                value={formData.installmentsCount}
                onChange={e => setFormData({...formData, installmentsCount: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Observações do Contrato</label>
            <textarea 
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-petrol-500 focus:border-transparent transition-all"
              placeholder="Notas internas, observações sobre o imóvel ou locatário..."
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      {/* Financial Details Modal */}
      <Modal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        title={`Financeiro - Contrato ${selectedLeaseForFinance?.contractNumber}`}
        className="max-w-4xl"
        footer={
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="gap-2"
                onClick={() => setIsAddInstallmentModalOpen(true)}
              >
                <Plus size={16} />
                Adicionar Parcela
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => {
                  setReadjustData({
                    newValue: selectedLeaseForFinance?.rentValue.toString() || '',
                    startDate: new Date().toISOString().split('T')[0],
                    months: '12'
                  });
                  setIsReadjustModalOpen(true);
                }}
              >
                <TrendingUp size={16} />
                Reajustar
              </Button>
            </div>
            <Button onClick={() => setIsFinanceModalOpen(false)}>Fechar</Button>
          </div>
        }
      >
        {selectedLeaseForFinance && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-petrol-500"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Recebido</p>
                  <div className="p-1.5 bg-petrol-50 text-petrol-600 rounded-lg">
                    <CheckCircle size={14} />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary?.totalReceived || 0)}
                </p>
              </Card>

              <Card className="p-4 bg-white border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Repasse Proprietário</p>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ArrowUpRight size={14} />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary?.totalRepassed || 0)}
                </p>
              </Card>

              <Card className="p-4 bg-white border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Receita Imobiliária</p>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <DollarSign size={14} />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary?.totalAgency || 0)}
                </p>
              </Card>

              <Card className="p-4 bg-white border-slate-200 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pendente Repasse</p>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Clock size={14} />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((financialSummary?.totalOwner || 0) - (financialSummary?.totalRepassed || 0))}
                </p>
              </Card>
            </div>

            <div className="bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase">Vencimento</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase">Lançamento</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase">Valor Total</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase">Taxa Imob.</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase">Líquido Prop.</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase">Repasse</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase">Status Pagto</th>
                    <th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaseInstallments.map((inst) => (
                    <tr 
                      key={inst.id} 
                      className={cn(
                        "transition-all border-l-4 text-xs text-slate-600",
                        inst.status === 'paid' 
                          ? "bg-emerald-50 border-l-emerald-500 hover:bg-emerald-100" 
                          : inst.status === 'overdue' 
                            ? "bg-red-50 border-l-red-500 hover:bg-red-100" 
                            : "bg-amber-50 border-l-amber-500 hover:bg-amber-100"
                      )}
                    >
                      <td className="px-2 py-4 font-medium truncate">
                        {formatDate(inst.dueDate)}
                      </td>
                      <td className="px-2 py-4 text-[10px]">
                        <div className="flex flex-col">
                          <span className="font-medium">{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                          <span>{inst.createdAt ? new Date(inst.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}</span>
                        </div>
                      </td>
                      <td className="px-2 py-4 font-bold text-slate-900 truncate">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                      </td>
                      <td className="px-2 py-4 font-medium text-slate-500 truncate">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.agencyFeeValue)}
                      </td>
                      <td className="px-2 py-4 font-medium text-slate-600 truncate">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.ownerValue)}
                      </td>
                      <td className="px-2 py-4">
                        <div 
                          className={cn(
                            "flex items-center justify-center w-16 h-6 rounded text-[9px] font-bold uppercase transition-all border",
                            inst.remittanceStatus === 'completed' 
                              ? "bg-teal-100 text-teal-700 border-teal-200" 
                              : "bg-slate-100 text-slate-600 border-slate-200",
                            inst.status !== 'paid' && "opacity-30"
                          )}
                        >
                          {inst.remittanceStatus === 'completed' ? 'Realizado' : 'Pendente'}
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleTogglePayment(inst.id)}
                            className={cn(
                              "flex items-center justify-center w-16 h-6 rounded text-[9px] font-bold uppercase transition-all border",
                              inst.status === 'paid' 
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                : inst.status === 'overdue'
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                            )}
                          >
                            {inst.status === 'paid' ? 'Pago' : inst.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-right">
                        <div className="flex justify-end gap-1 items-center">
                          {inst.status === 'paid' && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => {
                                  setSelectedInstallmentForReceipt(inst);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Gerar Recibo"
                              >
                                <Receipt size={14} />
                              </button>
                              <div className="flex items-center gap-1">
                                <label className="cursor-pointer p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Anexar Recibo Assinado">
                                  <Download size={14} className="rotate-180" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        // Simulate upload
                                        const mockUrl = URL.createObjectURL(file);
                                        updateInstallment({
                                          ...inst,
                                          signedReceiptUrl: mockUrl
                                        });
                                        alert(`Arquivo ${file.name} anexado com sucesso.`);
                                      }
                                    }}
                                  />
                                </label>
                                {inst.signedReceiptUrl && (
                                  <button 
                                    onClick={() => window.open(inst.signedReceiptUrl, '_blank')}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title="Visualizar Recibo Assinado"
                                  >
                                    <FileText size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          <button 
                            onClick={() => openEditInstallmentModal(inst)}
                            title={inst.status === 'paid' ? "Não é possível editar parcela paga" : "Editar Parcela"}
                            disabled={inst.status === 'paid'}
                            className={cn(
                              "p-1 rounded transition-colors",
                              inst.status === 'paid' 
                                ? "text-slate-300 cursor-not-allowed" 
                                : "text-slate-400 hover:text-petrol-600 hover:bg-petrol-50"
                            )}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => confirmDeleteInstallment(inst)}
                            title="Excluir Parcela"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </Modal>

      {/* Cancellation Modal */}

      {/* Readjustment Modal */}
      <Modal
        isOpen={isReadjustModalOpen}
        onClose={() => setIsReadjustModalOpen(false)}
        title="Reajuste de Contrato"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReadjustModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleReadjustment} className="bg-indigo-600 hover:bg-indigo-700">Gerar Novas Parcelas</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Informe o novo valor do aluguel e a partir de quando as novas parcelas serão geradas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Novo Valor Aluguel</label>
              <Input 
                type="number" 
                value={readjustData.newValue}
                onChange={e => setReadjustData({...readjustData, newValue: e.target.value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Início do Reajuste</label>
              <Input 
                type="date" 
                value={readjustData.startDate}
                onChange={e => setReadjustData({...readjustData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Qtd de Parcelas</label>
              <Input 
                type="number" 
                value={readjustData.months}
                onChange={e => setReadjustData({...readjustData, months: e.target.value})}
                placeholder="12"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Manual Installment Modal */}
      <Modal
        isOpen={isAddInstallmentModalOpen}
        onClose={() => {
          setIsAddInstallmentModalOpen(false);
          setEditingInstallment(null);
        }}
        title={editingInstallment ? "Editar Parcela" : "Adicionar Parcela Manual"}
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setIsAddInstallmentModalOpen(false);
              setEditingInstallment(null);
            }}>Cancelar</Button>
            <Button onClick={handleAddManualInstallment}>{editingInstallment ? "Salvar" : "Adicionar"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Vencimento</label>
              <Input 
                type="date" 
                value={newInstallmentData.dueDate}
                onChange={e => setNewInstallmentData({...newInstallmentData, dueDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Valor Total</label>
              <Input 
                type="number" 
                placeholder="R$ 0,00"
                value={newInstallmentData.value}
                onChange={e => setNewInstallmentData({...newInstallmentData, value: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Valor Taxa Adm</label>
              <Input 
                type="number" 
                placeholder="R$ 0,00"
                value={newInstallmentData.agencyFeeValue}
                onChange={e => setNewInstallmentData({...newInstallmentData, agencyFeeValue: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Status Pagto</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={newInstallmentData.status}
                onChange={e => setNewInstallmentData({...newInstallmentData, status: e.target.value as any})}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Atrasado</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-all border-b-2",
            activeTab === 'active' 
              ? "border-petrol-900 text-petrol-900" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Contratos Ativos
        </button>
        <button
          onClick={() => setActiveTab('no-contract')}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-all border-b-2",
            activeTab === 'no-contract' 
              ? "border-petrol-900 text-petrol-900" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Imóveis sem Contrato
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-all border-b-2",
            activeTab === 'history' 
              ? "border-petrol-900 text-petrol-900" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Histórico de Contratos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {activeTab === 'active' || activeTab === 'history' ? (
          <>
            <Card className="lg:col-span-1 p-6 space-y-6 h-fit">
              <h3 className="font-bold text-slate-900">Filtros Avançados</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-petrol-500/20 outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>Todos os Status</option>
                    <option>Ativos</option>
                    <option>Vencidos</option>
                    <option>Rescindidos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vencimento</label>
                  <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-petrol-500/20 outline-none">
                    <option>Qualquer período</option>
                    <option>Próximos 30 dias</option>
                    <option>Próximos 90 dias</option>
                    <option>Este ano</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Proprietário</label>
                  <Input placeholder="Nome do proprietário..." />
                </div>
                <Button variant="outline" className="w-full">Limpar Filtros</Button>
              </div>
            </Card>

            <div className="lg:col-span-3 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input placeholder="Buscar por contrato, imóvel ou locatário..." className="pl-10" />
                </div>
              </div>

              <div className="space-y-4">
                {leases
                  .filter(lease => {
                    if (activeTab === 'history') {
                      return lease.status === 'terminated' || lease.status === 'expired';
                    }
                    // activeTab === 'active'
                    if (statusFilter === 'Todos os Status') return lease.status !== 'terminated';
                    if (statusFilter === 'Ativos') return lease.status === 'active';
                    if (statusFilter === 'Vencidos') return lease.status === 'expired';
                    if (statusFilter === 'Rescindidos') return lease.status === 'terminated';
                    return true;
                  })
                  .map((lease) => {
                  const property = properties.find(p => p.id === lease.propertyId);
                  const owner = owners.find(o => o.id === lease.ownerId);
                  const tenant = tenants.find(t => t.id === lease.tenantId);
                  const leaseInsts = installments.filter(i => i.leaseId === lease.id);
                  const overdueCount = leaseInsts.filter(i => i.status === 'overdue').length; 
                  const pendingCount = leaseInsts.filter(i => i.status === 'pending').length;
                  const allPaid = leaseInsts.length > 0 && leaseInsts.every(i => i.status === 'paid');
                  const isUpToDate = overdueCount === 0;

                  return (
                    <Card key={lease.id} className="p-0 overflow-hidden hover:border-petrol-200 transition-colors">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                          <div className="flex gap-4 cursor-pointer group/header" onClick={() => openEditModal(lease)}>
                            <div className="w-12 h-12 bg-petrol-50 rounded-xl flex items-center justify-center text-petrol-600 group-hover/header:bg-petrol-100 transition-colors">
                              <FileText size={24} />
                            </div>
                            <div>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-900 group-hover/header:text-petrol-700 transition-colors text-lg">{property?.title}</h3>
                                  <Badge variant={lease.status === 'active' ? 'success' : lease.status === 'expired' ? 'warning' : 'default'}>
                                    {lease.status === 'active' ? 'Ativo' : lease.status === 'expired' ? 'Vencido' : 'Terminado'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-500">Contrato {lease.contractNumber || `#${lease.id.toString().slice(-6).toUpperCase()}`}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                  <Calendar size={12} />
                                  <span>Vigência: {formatDate(lease.startDate)} - {formatDate(lease.endDate)}</span>
                                </div>
                                {lease.observations && (
                                  <p className="text-[10px] text-slate-400 italic line-clamp-1 max-w-[300px] mt-1">
                                    "{lease.observations}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lease.status === 'active' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => confirmRescind(lease)}
                              >
                                <XCircle size={14} />
                                Rescindir
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="gap-2">
                              <Download size={14} />
                              PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => openEditModal(lease)}
                            >
                              <Edit size={14} />
                              Editar
                            </Button>
                            <button 
                              onClick={() => confirmDelete(lease.id)}
                              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Locatário</p>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold">
                                {tenant?.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{tenant?.name}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Vigência</p>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Calendar size={14} className="text-slate-400" />
                              <span>{formatDate(lease.startDate)} - {formatDate(lease.endDate)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Mensal</p>
                            <p className="text-sm font-bold text-petrol-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lease.rentValue)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Financeiro</p>
                            <div className="flex items-center gap-2">
                              {overdueCount > 0 ? (
                                <div className="flex items-center gap-1 text-red-600">
                                  <AlertTriangle size={14} />
                                  <span className="text-xs font-bold">{overdueCount} em atraso</span>
                                </div>
                              ) : allPaid ? (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 size={14} />
                                  <span className="text-xs font-bold">Tudo Pago</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 size={14} />
                                  <span className="text-xs font-bold">Em dia</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex gap-4">
                          <div className="text-[11px] text-slate-500">
                            <span className="font-bold">Reajuste:</span> {lease.adjustmentIndex}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            <span className="font-bold">Vencimento:</span> Dia {lease.dueDay}
                          </div>
                        </div>
                        <button 
                          onClick={() => openFinanceModal(lease)}
                          className="text-xs font-bold text-petrol-600 hover:text-petrol-800 flex items-center gap-1"
                        >
                          Ver Financeiro Detalhado
                          <DollarSign size={12} />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="lg:col-span-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties
                .filter(p => !leases.some(l => l.propertyId === p.id && l.status === 'active'))
                .map(property => {
                  const owner = owners.find(o => o.id === property.ownerId);
                  return (
                    <Card key={property.id} className="p-5 border-slate-200 hover:border-petrol-200 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-petrol-50 group-hover:text-petrol-600 transition-colors">
                          <Home size={24} />
                        </div>
                        <Badge variant="warning">Sem Contrato</Badge>
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{property.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{property.address}</p>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Proprietário</p>
                          <p className="text-sm font-medium text-slate-700">{owner?.name}</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="gap-2"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, propertyId: property.id }));
                            setIsModalOpen(true);
                          }}
                        >
                          <Plus size={14} />
                          Criar Contrato
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}
      </div>
      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Recibo de Pagamento de Aluguel"
        className="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir
            </Button>
            <Button onClick={() => setIsReceiptModalOpen(false)}>Fechar</Button>
          </div>
        }
      >
        {selectedInstallmentForReceipt && (() => {
          const lease = leases.find(l => l.id === selectedInstallmentForReceipt.leaseId);
          const property = properties.find(p => p.id === lease?.propertyId);
          const tenant = tenants.find(t => t.id === lease?.tenantId);
          
          const numberToWords = (num: number) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
          };

          return (
            <div className="p-8 border-2 border-slate-200 rounded-xl font-serif text-slate-900 bg-white">
              <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-petrol-900">RECIBO</h2>
                  <p className="text-sm text-slate-500">Nº {selectedInstallmentForReceipt.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-petrol-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInstallmentForReceipt.value)}
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-sm leading-relaxed">
                <p>
                  Recebemos de <span className="font-bold">{tenant?.name}</span>, a importância de 
                  <span className="font-bold italic"> {numberToWords(selectedInstallmentForReceipt.value)}</span>, 
                  referente ao pagamento do aluguel e encargos do imóvel situado em 
                  <span className="font-bold"> {property?.address}, {property?.neighborhood}, {property?.city}</span>, 
                  correspondente ao mês de <span className="font-bold">
                    {(() => {
                      const [year, month, day] = selectedInstallmentForReceipt.dueDate.split('-').map(Number);
                      const date = new Date(year, month - 1, day || 1);
                      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    })()}
                  </span>.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="font-bold mb-2 text-xs uppercase text-slate-500">Discriminação:</p>
                  <div className="grid grid-cols-2 gap-y-1 text-xs">
                    <span>Aluguel:</span>
                    <span className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lease?.rentValue || 0)}</span>
                    <span>Condomínio:</span>
                    <span className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lease?.fees.condo || 0)}</span>
                    <span>IPTU:</span>
                    <span className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lease?.fees.tax || 0)}</span>
                    <div className="col-span-2 border-t my-1"></div>
                    <span className="font-bold">TOTAL:</span>
                    <span className="font-bold text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInstallmentForReceipt.value)}</span>
                  </div>
                </div>

                <p className="text-right mt-12">
                  Bauru, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                <div className="mt-16 pt-4 border-t border-slate-900 text-center">
                  <p className="font-bold">IMOBIGESTÃO ADMINISTRAÇÃO IMOBILIÁRIA</p>
                  <p className="text-xs">CNPJ: 00.000.000/0001-00</p>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Cancellation Modal - Moved to end for higher Z-index */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirmar Cancelamento de Recebimento"
        zIndex={200}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleConfirmCancel} disabled={!cancelObservation.trim()}>
              Confirmar Estorno
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <p className="font-bold mb-1">Atenção!</p>
            <p>Você está prestes a cancelar um recebimento já confirmado. Esta operação irá estornar os valores do fluxo de caixa.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Motivo do Cancelamento</label>
            <textarea 
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="Descreva o motivo pelo qual está cancelando este recebimento..."
              value={cancelObservation}
              onChange={e => setCancelObservation(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      {/* Installment Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteInstallmentModalOpen}
        onClose={() => setIsDeleteInstallmentModalOpen(false)}
        title="Excluir Parcela"
        zIndex={300}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteInstallmentModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleDeleteInstallment} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!deleteJustification.trim()}
            >
              Excluir
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Atenção!</p>
              <p className="text-xs text-red-700 mt-1">
                Tem certeza que deseja excluir esta parcela? Esta ação é permanente e será registrada na auditoria.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Justificativa da Exclusão</label>
            <textarea 
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="Descreva o motivo da exclusão..."
              value={deleteJustification}
              onChange={e => setDeleteJustification(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Contrato"
        zIndex={300}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!deleteJustification.trim()}
            >
              Excluir
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Atenção!</p>
              <p className="text-xs text-red-700 mt-1">
                Tem certeza que deseja excluir este contrato? Esta ação é permanente e excluirá todas as parcelas associadas.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Justificativa da Exclusão</label>
            <textarea 
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="Descreva o motivo da exclusão..."
              value={deleteJustification}
              onChange={e => setDeleteJustification(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
