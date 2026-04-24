import React, { useState } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Home, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Edit,
  MapPin,
  Briefcase,
  FileText,
  DollarSign
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { cn } from '../../utils/cn';
import { Incident } from '../../types';
import { useData } from '../../context/DataContext';

export const IncidentsList = () => {
  const { 
    incidents, 
    addIncident, 
    updateIncident, 
    deleteIncident, 
    deleteIncidentWithAudit, 
    properties, 
    updateProperty, 
    leases, 
    vendors,
    addTransaction
  } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    leaseId: '',
    vendorId: '',
    category: 'maintenance' as any,
    description: '',
    responsible: '',
    status: 'open' as any,
    cost: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const property = properties.find(p => p.id === formData.propertyId);
    
    if (editingIncident) {
      updateIncident({
        ...editingIncident,
        propertyId: formData.propertyId,
        leaseId: formData.leaseId || undefined,
        vendorId: formData.vendorId || undefined,
        category: formData.category,
        description: formData.description,
        responsible: formData.responsible,
        status: formData.status,
        cost: formData.cost ? Number(formData.cost) : undefined
      });

      // Update property maintenance status based on incident status
      if (property && formData.category === 'maintenance') {
        if (formData.status === 'closed') {
          // Create financial transaction if cost exists and incident was just closed
          if (editingIncident.status !== 'closed' && formData.cost) {
            addTransaction({
              id: `trans-inc-${editingIncident.id}`,
              date: new Date().toISOString().split('T')[0],
              description: `Manutenção: ${formData.description}`,
              type: 'expense',
              category: 'Manutenção',
              value: Number(formData.cost),
              status: 'pending',
              relatedId: editingIncident.id,
              propertyId: property.id,
              ownerId: property.ownerId,
              competenceDate: new Date().toISOString().slice(0, 7)
            });
          }

          // Check if there are other open maintenance incidents for this property
          const otherOpenMaintenance = incidents.filter(inc => 
            inc.propertyId === formData.propertyId && 
            inc.id !== editingIncident.id && 
            inc.category === 'maintenance' &&
            inc.status !== 'closed'
          );
          if (otherOpenMaintenance.length === 0) {
            updateProperty({ ...property, isUnderMaintenance: false });
          }
        } else {
          updateProperty({ ...property, isUnderMaintenance: true });
        }
      }
    } else {
      const incident: Incident = {
        id: `inc${Date.now()}`,
        propertyId: formData.propertyId,
        leaseId: formData.leaseId || undefined,
        vendorId: formData.vendorId || undefined,
        category: formData.category,
        description: formData.description,
        status: 'open',
        responsible: formData.responsible,
        createdAt: new Date().toISOString().split('T')[0],
        cost: formData.cost ? Number(formData.cost) : undefined
      };
      addIncident(incident);

      // Automatically set property to maintenance when a new maintenance incident is created
      if (property && formData.category === 'maintenance') {
        updateProperty({ ...property, isUnderMaintenance: true });
      }
    }
    
    setIsModalOpen(false);
    setEditingIncident(null);
  };

  const confirmDelete = (id: string) => {
    setIncidentToDelete(id);
    setJustification('');
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (incidentToDelete && justification.trim()) {
      const incident = incidents.find(i => i.id === incidentToDelete);
      if (incident) {
        const propertyId = incident.propertyId;
        const property = properties.find(p => p.id === propertyId);
        
        const details = `Exclusão da ocorrência: ${incident.description} (${incident.category}) no imóvel ${property?.title || propertyId}`;
        try {
          await deleteIncidentWithAudit(incidentToDelete, details, justification);

          // Check if there are other open maintenance incidents for this property
          if (property && incident.category === 'maintenance') {
            const otherOpenMaintenance = incidents.filter(inc => 
              inc.propertyId === propertyId && 
              inc.id !== incidentToDelete && 
              inc.category === 'maintenance' &&
              inc.status !== 'closed'
            );
            if (otherOpenMaintenance.length === 0) {
              updateProperty({ ...property, isUnderMaintenance: false });
            }
          }
          setIsDeleteModalOpen(false);
          setIncidentToDelete(null);
        } catch (error) {
          console.error('Error deleting incident:', error);
          alert("Erro ao excluir ocorrência. Verifique sua conexão.");
        }
      }
    }
  };

  const openEditModal = (incident: Incident) => {
    setEditingIncident(incident);
    setFormData({
      propertyId: incident.propertyId,
      leaseId: incident.leaseId || '',
      vendorId: incident.vendorId || '',
      category: incident.category,
      description: incident.description,
      responsible: incident.responsible,
      status: incident.status,
      cost: incident.cost?.toString() || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ocorrências</h1>
          <p className="text-slate-500">Gerencie manutenções, reclamações e eventos nos imóveis.</p>
        </div>
        <Button className="gap-2" onClick={() => {
          setEditingIncident(null);
          setFormData({
            propertyId: properties.length > 0 ? properties[0].id : '',
            leaseId: '',
            vendorId: '',
            category: 'maintenance',
            description: '',
            responsible: '',
            status: 'open',
            cost: ''
          });
          setIsModalOpen(true);
        }}>
          <Plus size={16} />
          Nova Ocorrência
        </Button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Ocorrência"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} disabled={!justification.trim()}>Excluir</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-500">Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita e será registrada no log de auditoria.</p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Justificativa da Exclusão</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20 min-h-[80px]"
              placeholder="Digite o motivo da exclusão..."
              value={justification}
              onChange={e => setJustification(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingIncident ? "Editar Ocorrência" : "Nova Ocorrência"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingIncident ? "Salvar" : "Registrar"}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                <option value="maintenance">Manutenção</option>
                <option value="noise">Barulho</option>
                <option value="neighborhood">Vizinhança</option>
                <option value="billing">Cobrança</option>
                <option value="admin">Administrativo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="open">Aberta</option>
                <option value="in_progress">Em Andamento</option>
                <option value="closed">Fechada</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Vincular a Contrato (Opcional)</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.leaseId}
                onChange={e => setFormData({...formData, leaseId: e.target.value})}
              >
                <option value="">Nenhum contrato</option>
                {leases.filter(l => l.propertyId === formData.propertyId).map(l => (
                  <option key={l.id} value={l.id}>Contrato {l.contractNumber || l.id}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Prestador Vinculado</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.vendorId}
                onChange={e => setFormData({...formData, vendorId: e.target.value})}
              >
                <option value="">Nenhum prestador</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.service})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20 min-h-[100px]"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Responsável</label>
              <Input 
                value={formData.responsible}
                onChange={e => setFormData({...formData, responsible: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Custo do Serviço (R$)</label>
              <Input 
                type="number"
                placeholder="0,00"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-4">
        {incidents.map((incident) => {
          const property = properties.find(p => p.id === incident.propertyId);
          return (
            <Card key={incident.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    incident.status === 'open' ? "bg-red-50 text-red-600" : 
                    incident.status === 'in_progress' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{incident.description}</h3>
                      <Badge variant={incident.status === 'open' ? 'error' : incident.status === 'in_progress' ? 'warning' : 'success'}>
                        {incident.status === 'open' ? 'Aberta' : incident.status === 'in_progress' ? 'Em Andamento' : 'Fechada'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Home size={14} />
                        <span>{property?.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(incident.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>Resp: {incident.responsible || 'N/A'}</span>
                      </div>
                      {incident.vendorId && (
                        <div className="flex items-center gap-1 text-petrol-600 font-medium">
                          <Briefcase size={14} />
                          <span>{vendors.find(v => v.id === incident.vendorId)?.name}</span>
                        </div>
                      )}
                      {incident.leaseId && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <FileText size={14} />
                          <span>Contrato: {leases.find(l => l.id === incident.leaseId)?.contractNumber}</span>
                        </div>
                      )}
                      {incident.cost && (
                        <div className="flex items-center gap-1 text-petrol-700 font-bold">
                          <DollarSign size={14} />
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incident.cost)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(incident)}>
                    <Edit size={14} className="mr-2" />
                    Editar
                  </Button>
                  <button 
                    onClick={() => confirmDelete(incident.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
