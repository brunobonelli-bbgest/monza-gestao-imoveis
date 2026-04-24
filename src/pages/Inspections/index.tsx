import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Home, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download,
  Trash2,
  Edit,
  Eye,
  FileText
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { cn } from '../../utils/cn';
import { Inspection } from '../../types';
import { useData } from '../../context/DataContext';

export const InspectionsList = () => {
  const { inspections, addInspection, updateInspection, deleteInspection, deleteInspectionWithAudit, properties } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<string | null>(null);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    type: 'routine' as any,
    date: new Date().toISOString().split('T')[0],
    summary: '',
    status: 'completed' as any
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInspection) {
      updateInspection({
        ...editingInspection,
        propertyId: formData.propertyId,
        type: formData.type,
        date: formData.date,
        summary: formData.summary,
        status: formData.status
      });
    } else {
      const inspection: Inspection = {
        id: `insp${Date.now()}`,
        propertyId: formData.propertyId,
        type: formData.type,
        date: formData.date,
        status: formData.status,
        summary: formData.summary,
        items: [] // Simplified for now
      };
      addInspection(inspection);
    }
    
    setIsModalOpen(false);
    setEditingInspection(null);
  };

  const confirmDelete = (id: string) => {
    setInspectionToDelete(id);
    setDeleteJustification('');
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (inspectionToDelete && deleteJustification.trim()) {
      const inspection = inspections.find(i => i.id === inspectionToDelete);
      const property = properties.find(p => p.id === inspection?.propertyId);
      const details = `Exclusão da vistoria de ${inspection?.type === 'entry' ? 'Entrada' : inspection?.type === 'exit' ? 'Saída' : 'Rotina'} no imóvel ${property?.title || 'N/A'}`;
      
      try {
        await deleteInspectionWithAudit(inspectionToDelete, details, deleteJustification);
        setIsDeleteModalOpen(false);
        setInspectionToDelete(null);
        setDeleteJustification('');
      } catch (error) {
        console.error('Error deleting inspection:', error);
        alert("Erro ao excluir vistoria. Verifique sua conexão.");
      }
    }
  };

  const openEditModal = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setFormData({
      propertyId: inspection.propertyId,
      type: inspection.type,
      date: inspection.date,
      summary: inspection.summary || '',
      status: inspection.status
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vistorias</h1>
          <p className="text-slate-500">Acompanhe o estado de conservação dos imóveis.</p>
        </div>
        <Button className="gap-2" onClick={() => {
          setEditingInspection(null);
          setFormData({
            propertyId: properties.length > 0 ? properties[0].id : '',
            type: 'routine',
            date: new Date().toISOString().split('T')[0],
            summary: '',
            status: 'completed'
          });
          setIsModalOpen(true);
        }}>
          <Plus size={16} />
          Nova Vistoria
        </Button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Vistoria"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-500">Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.</p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Justificativa da Exclusão</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20 min-h-[80px]"
              placeholder="Explique o motivo da exclusão..."
              value={deleteJustification}
              onChange={e => setDeleteJustification(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingInspection ? "Editar Vistoria" : "Nova Vistoria"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingInspection ? "Salvar" : "Registrar"}</Button>
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
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="entry">Entrada</option>
                <option value="exit">Saída</option>
                <option value="routine">Rotina</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
              <Input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Resumo</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20 min-h-[100px]"
              value={formData.summary}
              onChange={e => setFormData({...formData, summary: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspections.map((inspection) => {
          const property = properties.find(p => p.id === inspection.propertyId);
          return (
            <Card key={inspection.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ClipboardCheck size={24} />
                </div>
                <Badge variant={inspection.status === 'completed' ? 'success' : 'warning'}>
                  {inspection.status === 'completed' ? 'Concluída' : 'Agendada'}
                </Badge>
              </div>
              
              <h3 className="font-bold text-slate-900 mb-1">
                Vistoria de {inspection.type === 'entry' ? 'Entrada' : inspection.type === 'exit' ? 'Saída' : 'Rotina'}
              </h3>
              <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                <Home size={14} />
                {property?.title}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                <Calendar size={14} />
                <span>{new Date(inspection.date).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(inspection)}>
                  <Edit size={14} className="mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="px-3">
                  <FileText size={14} />
                </Button>
                <button 
                  onClick={() => confirmDelete(inspection.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
