import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Briefcase, 
  ShieldCheck,
  MoreVertical,
  FileText,
  Trash2,
  Edit
} from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { cn } from '../../utils/cn';
import { Tenant } from '../../types';
import { useData } from '../../context/DataContext';

export const TenantsList = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const navigate = useNavigate();
  const { tenants, addTenant, updateTenant, deleteTenant, deleteTenantWithAudit, leases } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    occupation: '',
    income: 0
  });

  useEffect(() => {
    if (editingTenant) {
      setFormData({
        name: editingTenant.name,
        document: editingTenant.document,
        email: editingTenant.email,
        phone: editingTenant.phone,
        occupation: editingTenant.occupation || '',
        income: editingTenant.income || 0
      });
    } else {
      setFormData({
        name: '',
        document: '',
        email: '',
        phone: '',
        occupation: '',
        income: 0
      });
    }
  }, [editingTenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await updateTenant({
          ...editingTenant,
          name: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
          occupation: formData.occupation,
          income: formData.income
        });
      } else {
        const tenant: Tenant = {
          id: crypto.randomUUID(),
          name: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
          occupation: formData.occupation,
          income: formData.income
        };
        await addTenant(tenant);
      }
      setIsModalOpen(false);
      setEditingTenant(null);
    } catch (error) {
      console.error('Error saving tenant:', error);
      alert("Erro ao salvar locatário. Verifique sua conexão.");
    }
  };

  const confirmDelete = (id: string) => {
    setTenantToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (tenantToDelete) {
      try {
        await deleteTenantWithAudit(
          tenantToDelete, 
          `Exclusão de locatário: ${tenants.find(t => t.id === tenantToDelete)?.name}`,
          'Exclusão solicitada pelo usuário'
        );
        setIsDeleteModalOpen(false);
        setTenantToDelete(null);
      } catch (error) {
        console.error('Error deleting tenant:', error);
        alert("Erro ao excluir locatário. Verifique sua conexão.");
      }
    }
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {!hideHeader ? (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Locatários</h1>
            <p className="text-slate-500">Gerencie os inquilinos e seus históricos de locação.</p>
          </div>
        ) : <div />}
        <Button className="gap-2" onClick={() => { setEditingTenant(null); setIsModalOpen(true); }}>
          <Plus size={16} />
          Novo Locatário
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Locatário"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir permanentemente</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Tem certeza?</h3>
          <p className="text-slate-500 mt-2">
            Esta ação removerá o locatário. Certifique-se de que não há contratos ativos vinculados.
          </p>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTenant(null); }} 
        title={editingTenant ? "Editar Locatário" : "Cadastrar Novo Locatário"}
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingTenant(null); }}>Cancelar</Button>
            <Button onClick={handleSave}>{editingTenant ? "Salvar Alterações" : "Salvar Locatário"}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Nome Completo
              </label>
              <Input 
                placeholder="Ex: João Pereira" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                CPF
              </label>
              <Input 
                placeholder="000.000.000-00" 
                value={formData.document}
                onChange={e => setFormData({...formData, document: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
              <Input 
                type="email" 
                placeholder="joao@email.com" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
              <Input 
                placeholder="(11) 99999-9999" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Profissão / Ocupação</label>
              <Input 
                placeholder="Ex: Engenheiro de Software" 
                value={formData.occupation}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Renda Mensal (R$)</label>
              <Input 
                type="number"
                placeholder="0.00" 
                value={formData.income}
                onChange={e => setFormData({...formData, income: Number(e.target.value)})}
              />
            </div>
          </div>
        </form>
      </Modal>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por nome, CPF ou e-mail..." className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => {
          const lease = leases.find(l => l.tenantId === tenant.id);
          return (
            <Card key={tenant.id} className="p-6 hover:border-petrol-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 text-lg font-bold">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {tenant.name}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-slate-500">
                        CPF: {tenant.document}
                      </p>
                      {tenant.income && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          Renda: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tenant.income)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(tenant)}
                    className="p-2 text-slate-400 hover:text-petrol-600 hover:bg-petrol-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(tenant.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  {tenant.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  {tenant.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Briefcase size={14} className="text-slate-400" />
                  {tenant.occupation || 'Não informado'}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {lease ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FileText size={14} className="text-emerald-500" />
                      <span>Contrato Ativo</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs font-bold text-petrol-600"
                      onClick={() => navigate(`/contratos?id=${lease.id}`)}
                    >
                      Ver Contrato
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ShieldCheck size={14} />
                      <span>Sem contrato ativo</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-400">Histórico</Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
