import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  User, 
  DollarSign, 
  MoreVertical,
  Eye,
  Edit,
  FileText,
  AlertCircle,
  ClipboardCheck,
  ChevronRight,
  Trash2,
  Upload,
  X,
  Calendar,
  CheckCircle2,
  Briefcase,
  LayoutGrid,
  List
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Input, Modal } from '../../components/ui';
import { cn } from '../../utils/cn';
import { Property, Lease, Incident } from '../../types';
import { useData } from '../../context/DataContext';
import { ROUTES } from '../../config/routes';

export const PropertiesList = () => {
  const navigate = useNavigate();
  const { 
    properties, addProperty, updateProperty, deleteProperty, deletePropertyWithAudit,
    incidents, inspections, addIncident, updateIncident, addInspection, 
    leases, vendors, tenants, owners, addTransaction
  } = useData();
  const location = useLocation();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const maintenance = params.get('maintenance');
    if (status && ['rented', 'vacant', 'maintenance'].includes(status)) {
      setFilter(status);
    } else if (maintenance === 'true') {
      setFilter('maintenance');
    }

    const detailsId = params.get('details');
    if (detailsId) {
      const property = properties.find(p => p.id === detailsId);
      if (property) {
        openDetailsModal(property);
      }
    }
  }, [location, properties]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isIncidentDetailsModalOpen, setIsIncidentDetailsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Incident form state
  const [incidentData, setIncidentData] = useState({
    category: 'maintenance' as any,
    description: '',
    responsible: '',
    leaseId: '',
    vendorId: '',
    cost: ''
  });

  // Inspection form state
  const [inspectionData, setInspectionData] = useState({
    type: 'routine' as any,
    date: new Date().toISOString().split('T')[0],
    summary: '',
    items: [{ room: 'Geral', item: 'Geral', condition: 'ok' as any, notes: '' }]
  });
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'apartment' as any,
    rentValue: '',
    ownerId: '',
    address: '',
    neighborhood: '',
    city: '',
    imageUrl: '',
    status: 'vacant' as any,
    isUnderMaintenance: false,
    cep: '',
    ownerCpfSearch: ''
  });

  useEffect(() => {
    if (owners.length > 0 && !editingProperty && !formData.ownerId) {
      setFormData(prev => ({ ...prev, ownerId: owners[0].id }));
    }
  }, [owners, editingProperty]);

  useEffect(() => {
    if (editingProperty) {
      setFormData({
        title: editingProperty.title,
        type: editingProperty.type,
        rentValue: editingProperty.rentValue.toString(),
        ownerId: editingProperty.ownerId,
        address: editingProperty.address,
        neighborhood: editingProperty.neighborhood,
        city: editingProperty.city,
        imageUrl: editingProperty.images[0] || '',
        status: editingProperty.status,
        cep: '',
        isUnderMaintenance: editingProperty.isUnderMaintenance || false,
        ownerCpfSearch: ''
      });
    } else {
      setFormData({
        title: '',
        type: 'apartment',
        rentValue: '',
        ownerId: owners.length > 0 ? owners[0].id : '',
        address: '',
        neighborhood: '',
        city: '',
        imageUrl: '',
        status: 'vacant',
        cep: '',
        ownerCpfSearch: '',
        isUnderMaintenance: false
      });
    }
  }, [editingProperty, owners]);

  const [isCepLoading, setIsCepLoading] = useState(false);

  const handleCepSearch = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: `${data.logradouro}`,
          neighborhood: data.bairro,
          city: data.localidade
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleCpfSearch = () => {
    const cpf = formData.ownerCpfSearch.replace(/\D/g, '');
    if (!cpf) return;

    const owner = owners.find(o => o.document.replace(/\D/g, '') === cpf);
    if (owner) {
      setFormData(prev => ({ ...prev, ownerId: owner.id }));
    } else {
      alert("Proprietário não encontrado com este CPF/CNPJ.");
    }
  };

  const filteredProperties = properties.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'maintenance') return p.isUnderMaintenance || p.status === 'maintenance';
    return p.status === filter;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ownerId is a UUID
    const isOwnerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.ownerId);
    if (!isOwnerUuid) {
      alert("O proprietário selecionado ainda não foi sincronizado com o servidor. Por favor, aguarde um momento ou selecione outro proprietário.");
      return;
    }

    try {
      if (editingProperty) {
        await updateProperty({
          ...editingProperty,
          title: formData.title,
          type: formData.type,
          rentValue: Number(formData.rentValue),
          ownerId: formData.ownerId,
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          status: formData.status,
          isUnderMaintenance: formData.isUnderMaintenance,
          images: [formData.imageUrl || editingProperty.images[0]],
          cep: formData.cep
        });
      } else {
        const property: Property = {
          id: `p${Date.now()}`,
          title: formData.title,
          type: formData.type,
          rentValue: Number(formData.rentValue),
          ownerId: formData.ownerId,
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          status: formData.status,
          isUnderMaintenance: formData.isUnderMaintenance,
          images: [formData.imageUrl || 'https://picsum.photos/seed/new/800/600'],
          cep: formData.cep
        };
        await addProperty(property);
      }
      
      setIsModalOpen(false);
      setEditingProperty(null);
    } catch (error) {
      console.error('Error saving property:', error);
      alert("Erro ao salvar imóvel. Verifique sua conexão.");
    }
  };

  const confirmDelete = (id: string) => {
    setPropertyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (propertyToDelete) {
      try {
        await deletePropertyWithAudit(
          propertyToDelete, 
          `Exclusão de imóvel: ${properties.find(p => p.id === propertyToDelete)?.title}`,
          'Exclusão solicitada pelo usuário'
        );
        setIsDeleteModalOpen(false);
        setPropertyToDelete(null);
      } catch (error) {
        console.error('Error deleting property:', error);
        alert("Erro ao excluir imóvel. Verifique sua conexão.");
      }
    }
  };

  const openEditModal = (property: Property) => {
    const activeLease = leases.find(l => l.propertyId === property.id && l.status === 'active');
    setEditingProperty(property);
    setFormData({
      title: property.title,
      type: property.type,
      rentValue: (activeLease ? activeLease.rentValue : property.rentValue).toString(),
      ownerId: property.ownerId,
      address: property.address,
      neighborhood: property.neighborhood,
      city: property.city,
      status: property.status,
      isUnderMaintenance: property.isUnderMaintenance || false,
      imageUrl: property.images[0],
      cep: property.cep || '',
      ownerCpfSearch: ''
    });
    setIsModalOpen(true);
  };

  const openDetailsModal = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailsModalOpen(true);
    setActiveTab('general');
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    // Find active lease for this property to link automatically
    const activeLease = leases.find(l => l.propertyId === selectedProperty.id && l.status === 'active');

    addIncident({
      id: `inc${Date.now()}`,
      propertyId: selectedProperty.id,
      leaseId: activeLease?.id,
      vendorId: incidentData.vendorId || undefined,
      category: incidentData.category,
      description: incidentData.description,
      status: 'open',
      responsible: incidentData.responsible,
      createdAt: new Date().toISOString().split('T')[0],
      cost: incidentData.cost ? Number(incidentData.cost) : undefined
    });

    // Update property maintenance status if category is maintenance
    if (incidentData.category === 'maintenance') {
      updateProperty({ ...selectedProperty, isUnderMaintenance: true });
    }

    setIsIncidentModalOpen(false);
    setIncidentData({ category: 'maintenance', description: '', responsible: '', leaseId: '', vendorId: '', cost: '' });
  };

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    addInspection({
      id: `insp${Date.now()}`,
      propertyId: selectedProperty.id,
      type: inspectionData.type,
      date: inspectionData.date,
      status: 'completed',
      summary: inspectionData.summary,
      items: inspectionData.items
    });

    setIsInspectionModalOpen(false);
    setInspectionData({
      type: 'routine',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      items: [{ room: 'Geral', item: 'Geral', condition: 'ok', notes: '' }]
    });
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProperty(null);
    // Clear query params
    const params = new URLSearchParams(location.search);
    if (params.has('details')) {
      params.delete('details');
      const newSearch = params.toString();
      const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      window.history.replaceState(null, '', newPath);
    }
  };

  const getStatusBadge = (property: Property) => {
    return (
      <div className="flex flex-wrap gap-1">
        {property.status === 'rented' ? (
          <Badge variant="success">Alugado</Badge>
        ) : property.status === 'maintenance' ? (
          <Badge variant="error" className="flex items-center gap-1">
            <AlertCircle size={10} />
            Manutenção
          </Badge>
        ) : (
          <Badge variant="warning">Vago</Badge>
        )}
        {property.isUnderMaintenance && property.status !== 'maintenance' && (
          <Badge variant="error" className="flex items-center gap-1">
            <AlertCircle size={10} />
            Manutenção
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Imóveis</h1>
          <p className="text-slate-500">Gerencie seu portfólio de imóveis e status de locação.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white text-petrol-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
              title="Visualização em Grade"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-petrol-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
              title="Visualização em Lista"
            >
              <List size={18} />
            </button>
          </div>
          <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Cadastrar Imóvel
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Imóvel"
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
            Esta ação não pode ser desfeita. O imóvel e todos os dados vinculados serão removidos.
          </p>
        </div>
      </Modal>

      {/* Property Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        title={`Detalhes: ${selectedProperty?.title}`}
        className="max-w-4xl"
      >
        {selectedProperty && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-100">
              {['general', 'incidents', 'inspections'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-3 text-sm font-bold transition-all border-b-2",
                    activeTab === tab 
                      ? "border-petrol-900 text-petrol-900" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab === 'general' ? 'Geral' : tab === 'incidents' ? 'Ocorrências' : 'Vistorias'}
                </button>
              ))}
            </div>

            <div className="py-2">
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <img 
                      src={selectedProperty.images[0]} 
                      className="w-full h-64 object-cover rounded-2xl shadow-sm" 
                      alt={selectedProperty.title} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tipo</p>
                        <p className="text-sm font-bold text-slate-900 capitalize">{selectedProperty.type}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedProperty)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Localização</h4>
                      <p className="text-slate-900 font-medium">{selectedProperty.address}</p>
                      <p className="text-sm text-slate-500">{selectedProperty.neighborhood}, {selectedProperty.city}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Financeiro</h4>
                      <p className="text-2xl font-bold text-petrol-900">
                        {(() => {
                          const lease = leases.find(l => l.propertyId === selectedProperty.id && l.status === 'active');
                          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lease ? lease.rentValue : selectedProperty.rentValue);
                        })()}
                        <span className="text-sm font-normal text-slate-400 ml-1">/mês</span>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Proprietário</h4>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-petrol-100 text-petrol-700 rounded-full flex items-center justify-center font-bold">
                          {owners.find(o => o.id === selectedProperty.ownerId)?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {owners.find(o => o.id === selectedProperty.ownerId)?.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {owners.find(o => o.id === selectedProperty.ownerId)?.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {leases.find(l => l.propertyId === selectedProperty.id) && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Contrato e Locatário</h4>
                        {(() => {
                          const lease = leases.find(l => l.propertyId === selectedProperty.id);
                          const tenant = tenants.find(t => t.id === lease?.tenantId);
                          return (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Contrato Ativo</span>
                                <button 
                                  onClick={() => {
                                    if (lease) {
                                      navigate(`${ROUTES.LEASES}?id=${lease.id}`);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-petrol-600 hover:underline"
                                >
                                  Ver Contrato
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                                  {tenant?.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{tenant?.name}</p>
                                  <p className="text-xs text-slate-500">{tenant?.phone}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'incidents' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">Histórico de Ocorrências</h4>
                    <Button size="sm" className="gap-2" onClick={() => setIsIncidentModalOpen(true)}>
                      <Plus size={14} />
                      Nova Ocorrência
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {incidents.filter(i => i.propertyId === selectedProperty.id).length > 0 ? (
                      incidents.filter(i => i.propertyId === selectedProperty.id).map(incident => (
                        <Card key={incident.id} className="p-4 border-slate-100">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                incident.status === 'open' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                <AlertCircle size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{incident.description}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{incident.category}</span>
                                  <span className="text-[10px] text-slate-400">•</span>
                                  <span className="text-[10px] text-slate-400">{new Date(incident.createdAt).toLocaleDateString('pt-BR')}</span>
                                  {incident.vendorId && (
                                    <>
                                      <span className="text-[10px] text-slate-400">•</span>
                                      <span className="text-[10px] text-petrol-600 font-bold uppercase">{vendors.find(v => v.id === incident.vendorId)?.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                                <button 
                                  onClick={() => {
                                    setSelectedIncident(incident);
                                    setIsIncidentDetailsModalOpen(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-petrol-600 hover:bg-petrol-50 rounded-lg transition-colors"
                                  title="Ver Detalhes"
                                >
                                  <Eye size={16} />
                                </button>
                              </div>
                              <Badge variant={incident.status === 'open' ? 'error' : 'success'}>
                                {incident.status === 'open' ? 'Aberta' : 'Fechada'}
                              </Badge>
                            </div>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500 text-sm">Nenhuma ocorrência registrada para este imóvel.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'inspections' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">Vistorias Realizadas</h4>
                    <Button size="sm" className="gap-2" onClick={() => setIsInspectionModalOpen(true)}>
                      <Plus size={14} />
                      Nova Vistoria
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {inspections.filter(i => i.propertyId === selectedProperty.id).length > 0 ? (
                      inspections.filter(i => i.propertyId === selectedProperty.id).map(inspection => (
                        <Card key={inspection.id} className="p-4 border-slate-100">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <ClipboardCheck size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  Vistoria de {inspection.type === 'entry' ? 'Entrada' : inspection.type === 'exit' ? 'Saída' : 'Rotina'}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Realizada em {new Date(inspection.date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                              <FileText size={14} />
                              Ver Relatório
                            </Button>
                          </div>
                          {inspection.summary && (
                            <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                              "{inspection.summary}"
                            </p>
                          )}
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <ClipboardCheck className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500 text-sm">Nenhuma vistoria registrada para este imóvel.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Incident Details Modal */}
      <Modal
        isOpen={isIncidentDetailsModalOpen}
        onClose={() => setIsIncidentDetailsModalOpen(false)}
        title="Detalhes da Ocorrência"
      >
        {selectedIncident && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant={selectedIncident.status === 'open' ? 'error' : 'success'} className="mb-2">
                  {selectedIncident.status === 'open' ? 'Aberta' : 'Fechada'}
                </Badge>
                <h3 className="text-lg font-bold text-slate-900">{selectedIncident.description}</h3>
                <p className="text-sm text-slate-500">Registrada em {new Date(selectedIncident.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Categoria</p>
                <p className="text-sm font-bold text-petrol-700 capitalize">{selectedIncident.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Responsável / Prestador</p>
                <p className="text-sm font-medium text-slate-700">{selectedIncident.responsible || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Custo do Serviço</p>
                <p className="text-sm font-bold text-slate-900">
                  {selectedIncident.cost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedIncident.cost) : 'R$ 0,00'}
                </p>
              </div>
            </div>

            {selectedIncident.vendorId && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Prestador Vinculado</p>
                {(() => {
                  const vendor = vendors.find(v => v.id === selectedIncident.vendorId);
                  return vendor ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <img src={vendor.avatar} className="w-10 h-10 rounded-lg object-cover" alt={vendor.name} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{vendor.name}</p>
                        <p className="text-xs text-slate-500">{vendor.service}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsIncidentDetailsModalOpen(false)}>Fechar</Button>
              {selectedIncident.status === 'open' && (
                <Button onClick={() => {
                  updateIncident({...selectedIncident, status: 'closed'});
                  
                  // Create financial transaction if cost exists
                  if (selectedIncident.cost && selectedProperty) {
                    addTransaction({
                      id: `trans-inc-${selectedIncident.id}`,
                      date: new Date().toISOString().split('T')[0],
                      description: `Manutenção: ${selectedIncident.description}`,
                      type: 'expense',
                      category: 'Manutenção',
                      value: selectedIncident.cost,
                      status: 'pending',
                      relatedId: selectedIncident.id,
                      propertyId: selectedProperty.id,
                      ownerId: selectedProperty.ownerId,
                      competenceDate: new Date().toISOString().slice(0, 7)
                    });
                  }
                  
                  // Update property maintenance status if needed
                  if (selectedProperty && selectedIncident.category === 'maintenance') {
                    const otherOpenMaintenance = incidents.filter(inc => 
                      inc.propertyId === selectedProperty.id && 
                      inc.id !== selectedIncident.id && 
                      inc.category === 'maintenance' &&
                      inc.status !== 'closed'
                    );
                    if (otherOpenMaintenance.length === 0) {
                      updateProperty({ ...selectedProperty, isUnderMaintenance: false });
                    }
                  }
                  
                  setIsIncidentDetailsModalOpen(false);
                }}>Fechar Ocorrência</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* New Incident Modal */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        title="Nova Ocorrência"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsIncidentModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddIncident}>Registrar Ocorrência</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleAddIncident}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
            <select 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
              value={incidentData.category}
              onChange={e => setIncidentData({...incidentData, category: e.target.value as any})}
            >
              <option value="maintenance">Manutenção</option>
              <option value="noise">Barulho / Reclamação</option>
              <option value="neighborhood">Vizinhança</option>
              <option value="billing">Cobrança</option>
              <option value="admin">Administrativo</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Prestador Vinculado</label>
            <select 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
              value={incidentData.vendorId}
              onChange={e => setIncidentData({...incidentData, vendorId: e.target.value})}
            >
              <option value="">Nenhum prestador</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.service})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20 min-h-[100px]"
              placeholder="Descreva o que aconteceu..."
              value={incidentData.description}
              onChange={e => setIncidentData({...incidentData, description: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Responsável / Prestador</label>
              <Input 
                placeholder="Ex: João Encanador" 
                value={incidentData.responsible}
                onChange={e => setIncidentData({...incidentData, responsible: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Custo do Serviço (R$)</label>
              <Input 
                type="number"
                placeholder="0,00"
                value={incidentData.cost}
                onChange={e => setIncidentData({...incidentData, cost: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        title="Nova Vistoria"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsInspectionModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddInspection}>Salvar Vistoria</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleAddInspection}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={inspectionData.type}
                onChange={e => setInspectionData({...inspectionData, type: e.target.value as any})}
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
                value={inspectionData.date}
                onChange={e => setInspectionData({...inspectionData, date: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Resumo / Conclusão</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20 min-h-[80px]"
              placeholder="Resumo geral do estado do imóvel..."
              value={inspectionData.summary}
              onChange={e => setInspectionData({...inspectionData, summary: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Fotos (URL)</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
              <Upload className="text-slate-400 mb-1" size={20} />
              <p className="text-[10px] text-slate-500">Funcionalidade de upload em breve</p>
            </div>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingProperty(null); }} 
        title={editingProperty ? "Editar Imóvel" : "Cadastrar Novo Imóvel"}
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingProperty(null); }}>Cancelar</Button>
            <Button onClick={handleSave}>{editingProperty ? "Salvar Alterações" : "Salvar Imóvel"}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Título do Imóvel</label>
            <Input 
              placeholder="Ex: Apartamento Moderno Vila Nova" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Buscar Proprietário (CPF/CNPJ)</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="000.000.000-00" 
                  value={formData.ownerCpfSearch}
                  onChange={e => setFormData({...formData, ownerCpfSearch: e.target.value})}
                />
                <Button type="button" variant="outline" onClick={handleCpfSearch}>Buscar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Proprietário Selecionado</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.ownerId}
                onChange={e => setFormData({...formData, ownerId: e.target.value})}
                required
              >
                <option value="" disabled>Selecione um proprietário</option>
                {owners.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.document})</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Foto do Imóvel</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-petrol-300 transition-colors bg-slate-50 relative group">
              {formData.imageUrl ? (
                <div className="relative w-full h-40">
                  <img src={formData.imageUrl} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, imageUrl: ''})}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="text-slate-400 mb-2" size={24} />
                  <p className="text-sm text-slate-500">Clique para carregar ou arraste uma foto</p>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG até 5MB</p>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="apartment">Apartamento</option>
                <option value="house">Casa</option>
                <option value="studio">Studio</option>
                <option value="commercial">Comercial</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Status de Locação</label>
              {(() => {
                const hasActiveLease = editingProperty && leases.some(l => l.propertyId === editingProperty.id && l.status === 'active');
                return (
                  <>
                    <select 
                      className={cn(
                        "w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20",
                        hasActiveLease ? "bg-slate-100 cursor-not-allowed" : ""
                      )}
                      value={hasActiveLease ? 'rented' : formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                      disabled={!!hasActiveLease}
                    >
                      <option value="vacant">Vago</option>
                      <option value="rented">Alugado</option>
                    </select>
                    {hasActiveLease && (
                      <p className="text-[10px] text-petrol-600 font-bold mt-1">
                        * Status fixo como 'Alugado' devido ao contrato ativo.
                      </p>
                    )}
                    {!hasActiveLease && formData.status === 'rented' && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">
                        * Imóvel sem contrato ativo será salvo como 'Vago'.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="space-y-2 flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-petrol-600 focus:ring-petrol-500 w-4 h-4"
                  checked={formData.isUnderMaintenance}
                  onChange={e => setFormData({...formData, isUnderMaintenance: e.target.checked})}
                />
                <span className="text-sm font-bold text-slate-700">Imóvel em Manutenção</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Valor do Aluguel</label>
              <div className="relative">
                {(() => {
                  const hasActiveLease = editingProperty && leases.some(l => l.propertyId === editingProperty.id && l.status === 'active');
                  return (
                    <>
                      <Input 
                        type="number" 
                        placeholder="R$ 0,00" 
                        value={formData.rentValue}
                        onChange={e => setFormData({...formData, rentValue: e.target.value})}
                        required
                        disabled={!!hasActiveLease}
                        className={hasActiveLease ? "bg-slate-100 cursor-not-allowed" : ""}
                      />
                      {hasActiveLease && (
                        <p className="text-[10px] text-petrol-600 font-bold mt-1">
                          * Valor fixo conforme contrato ativo. Edições devem ser feitas no contrato.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">CEP</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="00000-000" 
                  value={formData.cep}
                  onChange={e => setFormData({...formData, cep: e.target.value})}
                  onBlur={handleCepSearch}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleCepSearch} disabled={isCepLoading}>
                  {isCepLoading ? '...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
            <Input 
              placeholder="Rua, número, complemento" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Bairro</label>
              <Input 
                placeholder="Ex: Pinheiros" 
                value={formData.neighborhood}
                onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
              <Input 
                placeholder="Ex: São Paulo" 
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Buscar por endereço, bairro ou proprietário..." className="pl-10" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'rented', 'vacant', 'maintenance'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  filter === s 
                    ? "bg-petrol-900 text-white shadow-sm" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                {s === 'all' ? 'Todos' : s === 'rented' ? 'Alugados' : s === 'vacant' ? 'Vagos' : 'Manutenção'}
              </button>
            ))}
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Mais Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const owner = owners.find(o => o.id === property.ownerId);
            const lease = leases.find(l => l.propertyId === property.id && l.status === 'active');
            const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
            const displayRentValue = lease ? lease.rentValue : property.rentValue;
            
            return (
              <Card key={property.id} className="group hover:shadow-md transition-all border-slate-200">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    {getStatusBadge(property)}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => openEditModal(property)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-petrol-600 hover:bg-petrol-600 hover:text-white transition-all shadow-sm"
                      title="Editar Imóvel"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(property.id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      title="Excluir Imóvel"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="cursor-pointer" onClick={() => openDetailsModal(property)}>
                    <h3 className="font-bold text-slate-900 group-hover:text-petrol-900 transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-500 mt-1">
                      <MapPin size={14} />
                      <span className="text-xs line-clamp-1">{property.address}</span>
                    </div>
                  </div>

                  <div className="py-3 border-y border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Proprietário</p>
                        <div className="flex items-center gap-1 text-slate-700">
                          <User size={12} className="text-slate-400" />
                          <span className="text-xs font-medium line-clamp-1">{owner?.name || 'Não encontrado'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Locatário</p>
                        <div className="flex items-center gap-1 text-slate-700">
                          <User size={12} className="text-slate-400" />
                          <span className="text-xs font-medium line-clamp-1">{tenant?.name || 'Vago'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Aluguel</p>
                      <div 
                        onClick={() => {
                          if (lease) {
                            navigate(`${ROUTES.LEASES}?id=${lease.id}`);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border transition-colors",
                          lease 
                            ? "bg-slate-50 border-petrol-100 hover:bg-petrol-50 cursor-pointer hover:shadow-sm" 
                            : "bg-white border-slate-100"
                        )}
                      >
                        <p className="text-sm font-bold text-petrol-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayRentValue)}
                        </p>
                        {lease && (
                          <span className="text-[8px] text-petrol-600 font-bold uppercase tracking-wider">
                            Definido em Contrato
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => openDetailsModal(property)}>
                      <Eye size={14} />
                      Detalhes
                    </Button>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          if (lease) {
                            navigate(`${ROUTES.LEASES}?id=${lease.id}`);
                          }
                        }}
                        disabled={!lease}
                        title={lease ? "Ver Contrato" : "Sem contrato ativo"} 
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          lease 
                            ? "text-emerald-600 hover:bg-emerald-50" 
                            : "text-red-400 cursor-not-allowed"
                        )}
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Imóvel</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proprietário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Locatário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProperties.map((property) => {
                const owner = owners.find(o => o.id === property.ownerId);
                const lease = leases.find(l => l.propertyId === property.id && l.status === 'active');
                const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
                const displayRentValue = lease ? lease.rentValue : property.rentValue;

                return (
                  <tr key={property.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={property.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{property.title}</p>
                          <p className="text-xs text-slate-500">{property.neighborhood}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(property)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {owner?.name.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-700">{owner?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tenant ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-600">
                            {tenant.name.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-700">{tenant.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Vago</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-petrol-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayRentValue)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openDetailsModal(property)}
                          className="p-2 text-slate-400 hover:text-petrol-600 hover:bg-petrol-50 rounded-lg transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => openEditModal(property)}
                          className="p-2 text-slate-400 hover:text-petrol-600 hover:bg-petrol-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            if (lease) {
                              navigate(`${ROUTES.LEASES}?id=${lease.id}`);
                            }
                          }}
                          disabled={!lease}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            lease 
                              ? "text-emerald-600 hover:bg-emerald-50" 
                              : "text-red-400 cursor-not-allowed opacity-60"
                          )}
                          title={lease ? "Ver Contrato" : "Sem contrato ativo"}
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(property.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
