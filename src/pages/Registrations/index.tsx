import React, { useState } from 'react';
import { 
  Users, 
  UserCircle, 
  Wrench, 
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { OwnersList } from '../Owners';
import { TenantsList } from '../Tenants';
import { VendorsList } from '../Vendors';
import { SystemUsersList } from '../SystemUsers';

type RegistrationTab = 'owners' | 'tenants' | 'vendors' | 'users';

export const Registrations = () => {
  const [activeTab, setActiveTab] = useState<RegistrationTab>('owners');

  const tabs = [
    { id: 'owners', label: 'Proprietários', icon: UserCircle },
    { id: 'tenants', label: 'Locatários', icon: Users },
    { id: 'vendors', label: 'Prestadores', icon: Wrench },
    { id: 'users', label: 'Usuários do Sistema', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cadastro Geral</h1>
          <p className="text-slate-500">Gerencie todos os cadastros de pessoas e parceiros do sistema.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RegistrationTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-petrol-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'owners' && <OwnersList hideHeader={true} />}
        {activeTab === 'tenants' && <TenantsList hideHeader={true} />}
        {activeTab === 'vendors' && <VendorsList hideHeader={true} />}
        {activeTab === 'users' && <SystemUsersList />}
      </div>
    </div>
  );
};
