import React from 'react';
import { Search, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Topbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={toggleSidebar} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu size={20} />
        </button>
        
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar imóveis, proprietários..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petrol-500/20 focus:border-petrol-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin Imobiliária'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Administrador'}</p>
          </div>
          <div className="w-9 h-9 bg-petrol-100 rounded-full flex items-center justify-center text-petrol-900 font-bold border border-petrol-200">
            {(user?.name || 'AI').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
