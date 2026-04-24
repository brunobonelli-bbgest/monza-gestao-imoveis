import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../../components/ui';
import { cn } from '../../utils/cn';
import { Owner } from '../../types';
import { useData } from '../../context/DataContext';

export const OwnersList = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const navigate = useNavigate();
  const { owners, addOwner, updateOwner, deleteOwner, deleteOwnerWithAudit, properties } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    bankName: '',
    bankAgency: '',
    bankAccount: '',
    pixKey: '',
    cep: '',
    personType: 'PF' as 'PF' | 'PJ',
    companyName: '',
    stateRegistration: ''
  });

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep }));
    
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  useEffect(() => {
    if (editingOwner) {
      setFormData({
        name: editingOwner.name,
        document: editingOwner.document,
        email: editingOwner.email,
        phone: editingOwner.phone,
        address: editingOwner.address,
        bankName: editingOwner.bankName || '',
        bankAgency: editingOwner.bankAgency || '',
        bankAccount: editingOwner.bankAccount || '',
        pixKey: editingOwner.pixKey || '',
        cep: '',
        personType: editingOwner.personType || 'PF',
        companyName: editingOwner.companyName || '',
        stateRegistration: editingOwner.stateRegistration || ''
      });
    } else {
      setFormData({
        name: '',
        document: '',
        email: '',
        phone: '',
        address: '',
        bankName: '',
        bankAgency: '',
        bankAccount: '',
        pixKey: '',
        cep: '',
        personType: 'PF',
        companyName: '',
        stateRegistration: ''
      });
    }
  }, [editingOwner]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOwner) {
        await updateOwner({
          ...editingOwner,
          name: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          bankName: formData.bankName,
          bankAgency: formData.bankAgency,
          bankAccount: formData.bankAccount,
          pixKey: formData.pixKey,
          personType: formData.personType,
          companyName: formData.companyName,
          stateRegistration: formData.stateRegistration
        });
      } else {
        const owner: Owner = {
          id: crypto.randomUUID(),
          name: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          bankName: formData.bankName,
          bankAgency: formData.bankAgency,
          bankAccount: formData.bankAccount,
          pixKey: formData.pixKey,
          reportPreference: 'monthly',
          personType: formData.personType,
          companyName: formData.companyName,
          stateRegistration: formData.stateRegistration
        };
        await addOwner(owner);
      }
      setIsModalOpen(false);
      setEditingOwner(null);
    } catch (error) {
      console.error('Error saving owner:', error);
      alert("Erro ao salvar proprietário. Verifique sua conexão.");
    }
  };

  const confirmDelete = (id: string) => {
    setOwnerToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (ownerToDelete) {
      try {
        await deleteOwnerWithAudit(
          ownerToDelete, 
          `Exclusão de proprietário: ${owners.find(o => o.id === ownerToDelete)?.name}`,
          'Exclusão solicitada pelo usuário'
        );
        setIsDeleteModalOpen(false);
        setOwnerToDelete(null);
      } catch (error) {
        console.error('Error deleting owner:', error);
        alert("Erro ao excluir proprietário. Verifique sua conexão.");
      }
    }
  };

  const openEditModal = (owner: Owner) => {
    setEditingOwner(owner);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {!hideHeader ? (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Proprietários</h1>
            <p className="text-slate-500">Gerencie os proprietários e seus imóveis vinculados.</p>
          </div>
        ) : <div />}
        <Button className="gap-2" onClick={() => { setEditingOwner(null); setIsModalOpen(true); }}>
          <Plus size={16} />
          Novo Proprietário
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Proprietário"
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
            Esta ação removerá o proprietário. Certifique-se de que não há imóveis ativos vinculados.
          </p>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingOwner(null); }} 
        title={editingOwner ? "Editar Proprietário" : "Cadastrar Novo Proprietário"}
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingOwner(null); }}>Cancelar</Button>
            <Button onClick={handleSave}>{editingOwner ? "Salvar Alterações" : "Salvar Proprietário"}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, personType: 'PF' })}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                formData.personType === 'PF' ? "bg-white text-petrol-900 shadow-sm" : "text-slate-500"
              )}
            >
              Pessoa Física
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, personType: 'PJ' })}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                formData.personType === 'PJ' ? "bg-white text-petrol-900 shadow-sm" : "text-slate-500"
              )}
            >
              Pessoa Jurídica
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {formData.personType === 'PJ' ? 'Razão Social' : 'Nome Completo'}
              </label>
              <Input 
                placeholder={formData.personType === 'PJ' ? "Ex: Imobiliária Silva LTDA" : "Ex: Carlos Alberto Silva"} 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            {formData.personType === 'PJ' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Fantasia</label>
                <Input 
                  placeholder="Ex: Silva Imóveis" 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {formData.personType === 'PJ' ? 'CNPJ' : 'CPF'}
              </label>
              <Input 
                placeholder={formData.personType === 'PJ' ? "00.000.000/0000-00" : "000.000.000-00"} 
                value={formData.document}
                onChange={e => setFormData({...formData, document: e.target.value})}
                required
              />
            </div>
            {formData.personType === 'PJ' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Inscrição Estadual</label>
                <Input 
                  placeholder="Isento ou número" 
                  value={formData.stateRegistration}
                  onChange={e => setFormData({...formData, stateRegistration: e.target.value})}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
              <Input 
                type="email" 
                placeholder="carlos@email.com" 
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
              <label className="text-xs font-bold text-slate-500 uppercase">CEP</label>
              <Input 
                placeholder="00000-000" 
                value={formData.cep}
                onChange={handleCEPChange}
                maxLength={9}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
            <Input 
              placeholder="Rua, número, complemento, cidade - UF" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase">Dados Bancários para Repasse</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Banco</label>
                <Input 
                  placeholder="Ex: Nubank" 
                  value={formData.bankName}
                  onChange={e => setFormData({...formData, bankName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Agência</label>
                <Input 
                  placeholder="0001" 
                  value={formData.bankAgency}
                  onChange={e => setFormData({...formData, bankAgency: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Conta</label>
                <Input 
                  placeholder="123456-7" 
                  value={formData.bankAccount}
                  onChange={e => setFormData({...formData, bankAccount: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX</label>
                <Input 
                  placeholder="CPF, E-mail ou Celular" 
                  value={formData.pixKey}
                  onChange={e => setFormData({...formData, pixKey: e.target.value})}
                />
              </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {owners.map((owner) => {
          const ownerProperties = properties.filter(p => p.ownerId === owner.id);
          return (
            <Card key={owner.id} className="p-6 hover:border-petrol-200 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-petrol-900 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {owner.personType === 'PJ' && owner.companyName ? owner.companyName : owner.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {owner.personType === 'PJ' ? `CNPJ: ${owner.document}` : `CPF: ${owner.document}`}
                      {owner.personType === 'PJ' && owner.companyName && ` • ${owner.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(owner)}
                    className="p-2 text-slate-400 hover:text-petrol-600 hover:bg-petrol-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(owner.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  {owner.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  {owner.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 sm:col-span-2">
                  <MapPin size={16} className="text-slate-400" />
                  {owner.address}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Imóveis Vinculados</h4>
                  <Badge variant="info">{ownerProperties.length} Imóveis</Badge>
                </div>
                <div className="space-y-2">
                  {ownerProperties.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => navigate(`/imoveis?details=${p.id}`)}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Building size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{p.title}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-petrol-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1">Ver Perfil Completo</Button>
                <Button variant="secondary" className="flex-1">Extrato de Repasse</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
