import React, { useState } from 'react';
import { 
  User, 
  Plus, 
  Search, 
  Mail, 
  Shield, 
  Trash2,
  Edit,
  Lock
} from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../../components/ui';
import { SystemUser } from '../../types';
import { useData } from '../../context/DataContext';

export const SystemUsersList = () => {
  const { systemUsers, addSystemUser, updateSystemUser, deleteSystemUser, refreshData, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff' as const,
  });

  const handleRefresh = async () => {
    try {
      await refreshData();
    } catch (error: any) {
      alert(`Erro ao recarregar dados: ${error.message}`);
    }
  };

  React.useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        username: editingUser.username,
        email: '', // Email is not stored in profiles, we'd need to fetch it from auth if needed
        password: '',
        role: editingUser.role as any,
      });
    } else {
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'staff',
      });
    }
  }, [editingUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateSystemUser({
          ...editingUser,
          name: formData.name,
          username: formData.username,
          role: formData.role,
        });
      } else {
        await addSystemUser({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          permissions: ['read', 'write'],
        });
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      alert(`Erro ao salvar usuário: ${error.message}`);
    }
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteSystemUser(userToDelete);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cadastro Geral de Usuários</h2>
          <p className="text-sm text-slate-500">Gerencie os acessos e permissões dos colaboradores da plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Carregando...' : 'Recarregar'}
          </Button>
          <Button className="gap-2" onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
            <Plus size={16} />
            Novo Usuário
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
        <Shield className="text-amber-600 shrink-0" size={20} />
        <div>
          <p className="text-sm font-bold text-amber-900">Segurança do Sistema</p>
          <p className="text-xs text-amber-700">
            Os usuários cadastrados aqui poderão realizar login utilizando o <strong>Usuário (Login)</strong> e a <strong>Senha</strong> definidos no momento do cadastro.
          </p>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Usuário"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Remover Acesso?</h3>
          <p className="text-slate-500 mt-2">
            Este usuário não poderá mais logar no sistema.
          </p>
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }} 
        title={editingUser ? "Editar Usuário" : "Cadastrar Novo Usuário"}
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
            <Input 
              placeholder="Ex: Admin Sistema" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Usuário (Login)</label>
              <Input 
                placeholder="admin.imobi" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
              <Input 
                type="email"
                placeholder="email@exemplo.com" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required={!editingUser}
                disabled={!!editingUser}
              />
              {editingUser && <p className="text-[10px] text-slate-400 italic">E-mail não pode ser alterado por aqui.</p>}
            </div>
          </div>
          {!editingUser && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
              <Input 
                type="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Cargo / Nível de Acesso</label>
            <select 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            >
              <option value="admin">Administrador (Acesso Total)</option>
              <option value="manager">Gerente (Financeiro + Contratos)</option>
              <option value="staff">Operacional (Vistorias + Ocorrências)</option>
            </select>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemUsers.map((user) => (
          <Card key={user.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{user.name}</h3>
                  <p className="text-xs text-slate-500">@{user.username}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => confirmDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant={user.role === 'admin' ? 'success' : 'info'}>
                {user.role.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Shield size={10} />
                {user.permissions.length} permissões ativas
              </div>
            </div>
          </Card>
        ))}
        {systemUsers.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Lock className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-500">Nenhum usuário adicional cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
