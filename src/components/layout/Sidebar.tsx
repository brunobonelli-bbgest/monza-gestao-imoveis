import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  FileText, 
  BarChart3,
  LogOut,
  X,
  DollarSign,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD },
  { icon: LayoutGrid, label: 'Cadastro Geral', path: ROUTES.REGISTRATIONS },
  { icon: Home, label: 'Imóveis', path: ROUTES.PROPERTIES },
  { icon: FileText, label: 'Contratos', path: ROUTES.LEASES },
  { icon: DollarSign, label: 'Financeiro', path: ROUTES.FINANCE },
  { icon: BarChart3, label: 'Relatórios', path: ROUTES.REPORTS },
];

export const Sidebar = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={toggle}
        />
      )}
      
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-petrol-900 rounded-lg flex items-center justify-center">
                <Home className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-petrol-900 tracking-tight">ImobiGestão</span>
            </div>
            <button onClick={toggle} className="md:hidden p-1 text-slate-500">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive ? "bg-petrol-50 text-petrol-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
