import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Briefcase, 
  CheckCircle2, 
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Award,
  Clock,
  DollarSign,
  Home
} from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../../components/ui';
import { cn } from '../../utils/cn';
import { Vendor, Incident, Property } from '../../types';
import { useData } from '../../context/DataContext';

const StarRating = ({ rating, onRatingChange, interactive = false }: { rating: number; onRatingChange?: (rating: number) => void; interactive?: boolean }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRatingChange?.(star)}
          className={cn(
            "transition-colors",
            interactive ? "cursor-pointer hover:scale-110" : "cursor-default",
            star <= rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
          )}
        >
          <Star size={interactive ? 20 : 14} />
        </button>
      ))}
    </div>
  );
};

export const VendorsList = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const { vendors, addVendor, updateVendor, deleteVendor, deleteVendorWithAudit, incidents, properties } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const [deleteJustification, setDeleteJustification] = useState('');
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isIncidentDetailsModalOpen, setIsIncidentDetailsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    contact: '',
    email: '',
    phone: '',
    city: '',
    availability: '',
    averageCost: '',
    bio: '',
    avatar: '',
    skills: '',
    rating: 5
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendor) {
      updateVendor({
        ...editingVendor,
        name: formData.name,
        service: formData.service,
        contact: formData.contact,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        availability: formData.availability,
        averageCost: Number(formData.averageCost),
        bio: formData.bio,
        avatar: formData.avatar || `https://picsum.photos/seed/${formData.name}/200/200`,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        rating: formData.rating
      });
    } else {
      const vendor: Vendor = {
        id: `v${Date.now()}`,
        name: formData.name,
        service: formData.service,
        contact: formData.contact,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        availability: formData.availability,
        averageCost: Number(formData.averageCost),
        rating: formData.rating,
        avatar: formData.avatar || `https://picsum.photos/seed/${formData.name}/200/200`,
        bio: formData.bio,
        completedJobs: 0,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
      };
      addVendor(vendor);
    }
    setIsModalOpen(false);
    setEditingVendor(null);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      service: vendor.service,
      contact: vendor.contact,
      email: vendor.email,
      phone: vendor.phone,
      city: vendor.city,
      availability: vendor.availability,
      averageCost: vendor.averageCost.toString(),
      bio: vendor.bio || '',
      avatar: vendor.avatar || '',
      skills: vendor.skills.join(', '),
      rating: vendor.rating
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      service: '',
      contact: '',
      email: '',
      phone: '',
      city: '',
      availability: '',
      averageCost: '',
      bio: '',
      avatar: '',
      skills: '',
      rating: 5
    });
    setEditingVendor(null);
  };

  const handleDelete = async () => {
    if (vendorToDelete && deleteJustification.trim()) {
      const vendor = vendors.find(v => v.id === vendorToDelete);
      const details = `Exclusão do prestador: ${vendor?.name} (${vendor?.service})`;
      try {
        await deleteVendorWithAudit(vendorToDelete, details, deleteJustification);
        setIsDeleteModalOpen(false);
        setVendorToDelete(null);
        setDeleteJustification('');
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert("Erro ao excluir prestador. Verifique sua conexão.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {!hideHeader ? (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Prestadores de Serviço</h1>
            <p className="text-slate-500">Rede de profissionais qualificados para manutenção e reparos.</p>
          </div>
        ) : <div />}
        <Button className="gap-2" onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={16} />
          Novo Prestador
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por nome, serviço ou especialidade..." className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
            {/* Header/Banner Area */}
            <div className="h-24 bg-gradient-to-r from-petrol-900 to-petrol-700 relative">
              <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-lg">
                  <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => openEditModal(vendor)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => { setVendorToDelete(vendor.id); setIsDeleteModalOpen(true); }}
                  className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-200 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="pt-16 pb-8 px-8">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-900">{vendor.name}</h2>
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 size={12} />
                        Verificado
                      </Badge>
                    </div>
                    <p className="text-lg text-slate-600 font-medium">{vendor.service}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {vendor.city}</span>
                      <StarRating rating={vendor.rating} />
                      <span className="text-slate-400">({vendor.completedJobs} serviços)</span>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed max-w-3xl">
                    {vendor.bio || "Nenhuma biografia disponível para este prestador."}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {vendor.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-80 space-y-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Informações de Contato</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail size={16} className="text-slate-400" />
                        {vendor.email}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone size={16} className="text-slate-400" />
                        {vendor.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        {vendor.availability}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                        <DollarSign size={16} className="text-slate-400" />
                        Média: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendor.averageCost)}
                      </div>
                    </div>
                    <Button className="w-full gap-2 mt-2">
                      <Mail size={16} />
                      Solicitar Orçamento
                    </Button>
                  </div>

                  {/* Service History moved here */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Histórico de Serviços</h3>
                    <div className="space-y-2">
                      {incidents.filter(i => i.vendorId === vendor.id).length > 0 ? (
                        incidents.filter(i => i.vendorId === vendor.id).map(incident => {
                          const property = properties.find(p => p.id === incident.propertyId);
                          return (
                            <div 
                              key={incident.id} 
                              className="p-3 bg-white rounded-lg border border-slate-100 hover:border-petrol-200 transition-colors cursor-pointer group"
                              onClick={() => {
                                setSelectedIncident(incident);
                                setIsIncidentDetailsModalOpen(true);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-bold text-slate-900 group-hover:text-petrol-700 transition-colors">{incident.description}</p>
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                    <Home size={10} /> {property?.title}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-petrol-700">
                                    {incident.cost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incident.cost) : 'N/A'}
                                  </p>
                                  <p className="text-[8px] text-slate-400">
                                    {new Date(incident.createdAt).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic px-1">Nenhum serviço registrado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Incident Details Modal */}
      <Modal
        isOpen={isIncidentDetailsModalOpen}
        onClose={() => setIsIncidentDetailsModalOpen(false)}
        title="Detalhes do Serviço"
      >
        {selectedIncident && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant={selectedIncident.status === 'open' ? 'error' : 'success'} className="mb-2">
                  {selectedIncident.status === 'open' ? 'Em Aberto' : 'Concluído'}
                </Badge>
                <h3 className="text-lg font-bold text-slate-900">{selectedIncident.description}</h3>
                <p className="text-sm text-slate-500">Realizado em {new Date(selectedIncident.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Categoria</p>
                <p className="text-sm font-bold text-petrol-700 capitalize">{selectedIncident.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Imóvel</p>
                {(() => {
                  const property = properties.find(p => p.id === selectedIncident.propertyId);
                  return (
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Home size={14} className="text-slate-400" />
                      {property?.title}
                    </div>
                  );
                })()}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Valor do Serviço</p>
                <p className="text-sm font-bold text-slate-900">
                  {selectedIncident.cost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedIncident.cost) : 'R$ 0,00'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Descrição Completa</p>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {selectedIncident.description || "Nenhuma descrição detalhada disponível."}
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsIncidentDetailsModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remover Prestador"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Remover</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600">Tem certeza que deseja remover este prestador da sua rede?</p>
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVendor ? "Editar Prestador" : "Novo Prestador"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome / Empresa</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Serviço Principal</label>
              <Input value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
              <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Custo Médio</label>
              <Input type="number" value={formData.averageCost} onChange={e => setFormData({...formData, averageCost: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Avaliação (1-5 Estrelas)</label>
              <div className="pt-1">
                <StarRating 
                  rating={formData.rating} 
                  interactive={true} 
                  onRatingChange={(val) => setFormData({...formData, rating: val})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Foto do Prestador</label>
              <div className="flex items-center gap-4">
                {formData.avatar && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                    <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-petrol-50 file:text-petrol-700 hover:file:bg-petrol-100"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Disponibilidade</label>
            <Input value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Bio / Descrição</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20 min-h-[100px]"
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Especialidades (separadas por vírgula)</label>
            <Input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
          </div>
        </form>
      </Modal>
    </div>
  );
};
