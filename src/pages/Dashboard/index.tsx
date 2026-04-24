import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  ClipboardCheck,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Search,
  Filter,
  MapPin,
  User,
  History,
  Activity,
  ChevronRight,
  Download,
  MoreVertical,
  Wrench,
  Truck,
  ClipboardList,
  Shield
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Input, Select, ChartContainer } from '../../components/ui';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { ROUTES } from '../../config/routes';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, isAfter, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Helper Components ---

const StatCard = ({ title, value, subValue, icon: Icon, trend, color, onClick }: any) => (
  <Card 
    className={cn(
      "p-5 transition-all duration-300 border-slate-100 shadow-sm hover:shadow-md",
      onClick && "cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
    )}
    onClick={onClick}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subValue && <p className="text-[11px] text-slate-400 font-medium">{subValue}</p>}
      </div>
      <div className={cn("p-2.5 rounded-xl text-white shadow-sm", color)}>
        <Icon size={18} />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-3 flex items-center gap-1.5">
        <div className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
          trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {Math.abs(trend)}%
        </div>
        <span className="text-[10px] text-slate-400 font-medium">vs. período anterior</span>
      </div>
    )}
  </Card>
);

const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
  <div className="flex items-center gap-3 mb-6 pt-4 border-t border-slate-100 first:border-0 first:pt-0">
    <div className="p-2 bg-petrol-50 text-petrol-600 rounded-lg">
      <Icon size={20} />
    </div>
    <div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const DataTable = ({ columns, data, emptyMessage = "Nenhum dado encontrado" }: any) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-100">
          {columns.map((col: any, i: number) => (
            <th key={i} className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? data.map((row: any, i: number) => (
          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
            {columns.map((col: any, j: number) => (
              <td key={j} className="py-3 px-4 text-sm text-slate-600">
                {col.render ? col.render(row) : row[col.accessor]}
              </td>
            ))}
          </tr>
        )) : (
          <tr>
            <td colSpan={columns.length} className="py-8 text-center text-slate-400 text-sm">
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const COLORS = ['#0a3d40', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

// --- Main Component ---

export const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    owners, properties, tenants, leases, installments, 
    transactions, incidents, vendors, inspections, auditLogs 
  } = useData();

  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'properties', label: 'Imóveis', icon: Home },
    { id: 'tenants', label: 'Locatários', icon: Users },
    { id: 'owners', label: 'Proprietários', icon: ShieldCheck },
    { id: 'maintenance', label: 'Manutenção', icon: Wrench },
    { id: 'vendors', label: 'Prestadores', icon: Truck },
    { id: 'inspections', label: 'Vistorias', icon: ClipboardList },
    { id: 'audit', label: 'Auditoria', icon: Shield },
  ];

  // --- Filter State ---
  const [filters, setFilters] = useState({
    period: '30', // days
    city: 'all',
    neighborhood: 'all',
    property: 'all',
    owner: 'all',
    tenant: 'all',
    leaseStatus: 'all',
    paymentStatus: 'all'
  });

  // --- Derived Data & Filtering Logic ---
  const filteredData = useMemo(() => {
    const now = new Date();
    const startDate = subDays(now, parseInt(filters.period));

    // Filter Leases
    const fLeases = leases.filter(l => {
      if (filters.leaseStatus !== 'all' && l.status !== filters.leaseStatus) return false;
      if (filters.property !== 'all' && l.propertyId !== filters.property) return false;
      if (filters.owner !== 'all' && l.ownerId !== filters.owner) return false;
      if (filters.tenant !== 'all' && l.tenantId !== filters.tenant) return false;
      return true;
    });

    // Filter Properties
    const fProperties = properties.filter(p => {
      if (filters.city !== 'all' && p.city !== filters.city) return false;
      if (filters.neighborhood !== 'all' && p.neighborhood !== filters.neighborhood) return false;
      if (filters.property !== 'all' && p.id !== filters.property) return false;
      if (filters.owner !== 'all' && p.ownerId !== filters.owner) return false;
      return true;
    });

    // Filter Installments
    const fInstallments = installments.filter(i => {
      if (i.isDeleted) return false;
      const dueDate = parseISO(i.dueDate);
      if (!isWithinInterval(dueDate, { start: startDate, end: now })) return false;
      if (filters.paymentStatus !== 'all' && i.status !== filters.paymentStatus) return false;
      
      const lease = leases.find(l => l.id === i.leaseId);
      if (!lease) return false;
      if (filters.property !== 'all' && lease.propertyId !== filters.property) return false;
      if (filters.owner !== 'all' && lease.ownerId !== filters.owner) return false;
      if (filters.tenant !== 'all' && lease.tenantId !== filters.tenant) return false;
      
      return true;
    });

    // Filter Remittances by Remittance Date (for "Repassado" metric)
    const fRemittances = installments.filter(i => {
      if (i.isDeleted) return false;
      if (i.remittanceStatus !== 'completed' || !i.remittanceDate) return false;
      
      const remDate = parseISO(i.remittanceDate);
      if (!isWithinInterval(remDate, { start: startDate, end: now })) return false;
      
      const lease = leases.find(l => l.id === i.leaseId);
      if (!lease) return false;
      if (filters.property !== 'all' && lease.propertyId !== filters.property) return false;
      if (filters.owner !== 'all' && lease.ownerId !== filters.owner) return false;
      
      return true;
    });

    // Filter Transactions
    const fTransactions = transactions.filter(t => {
      if (t.isDeleted) return false;
      const tDate = parseISO(t.date);
      if (!isWithinInterval(tDate, { start: startDate, end: now })) return false;
      if (filters.property !== 'all' && t.propertyId !== filters.property) return false;
      if (filters.owner !== 'all' && t.ownerId !== filters.owner) return false;
      return true;
    });

    return { fLeases, fProperties, fInstallments, fRemittances, fTransactions };
  }, [filters, leases, properties, installments, transactions]);

  const { fLeases, fProperties, fInstallments, fRemittances, fTransactions } = filteredData;

  // --- Calculations ---

  // Overview
  const totalProps = fProperties.length;
  const rentedProps = fProperties.filter(p => p.status === 'rented').length;
  const vacantProps = fProperties.filter(p => p.status === 'vacant').length;
  const activeLeasesCount = fLeases.filter(l => l.status === 'active').length;
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringLeases = leases.filter(l => {
    const end = parseISO(l.endDate);
    return l.status === 'active' && isWithinInterval(end, { start: new Date(), end: thirtyDaysFromNow });
  }).length;

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthInstallments = installments.filter(i => {
    if (i.isDeleted || !i.dueDate.startsWith(currentMonth)) return false;
    const lease = leases.find(l => l.id === i.leaseId);
    if (!lease) return false;
    if (filters.property !== 'all' && lease.propertyId !== filters.property) return false;
    if (filters.owner !== 'all' && lease.ownerId !== filters.owner) return false;
    if (filters.tenant !== 'all' && lease.tenantId !== filters.tenant) return false;
    return true;
  });
  const revenueExpected = monthInstallments.reduce((acc, curr) => acc + curr.value, 0);
  const revenueReceived = monthInstallments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.value, 0);
  
  // Financial - Snapshot of all pending/overdue (respecting property/owner filters)
  const totalToReceive = installments.filter(i => {
    if (i.isDeleted) return false;
    if (i.status === 'paid') return false;
    const lease = leases.find(l => l.id === i.leaseId);
    if (!lease) return false;
    if (filters.property !== 'all' && lease.propertyId !== filters.property) return false;
    if (filters.owner !== 'all' && lease.ownerId !== filters.owner) return false;
    if (filters.tenant !== 'all' && lease.tenantId !== filters.tenant) return false;
    return true;
  }).reduce((acc, curr) => acc + curr.value, 0);

  const totalOverdue = installments.filter(i => {
    if (i.isDeleted) return false;
    if (i.status !== 'overdue') return false;
    const lease = leases.find(l => l.id === i.leaseId);
    if (!lease) return false;
    if (filters.property !== 'all' && lease.propertyId !== filters.property) return false;
    if (filters.owner !== 'all' && lease.ownerId !== filters.owner) return false;
    if (filters.tenant !== 'all' && lease.tenantId !== filters.tenant) return false;
    return true;
  }).reduce((acc, curr) => acc + curr.value, 0);
  
  // Financial - Period based
  const totalRemittance = fRemittances.reduce((acc, curr) => acc + curr.ownerValue, 0);
  const avgRent = fLeases.length > 0 ? fLeases.reduce((acc, curr) => acc + curr.rentValue, 0) / fLeases.length : 0;
  const maintenanceCost = fTransactions.filter(t => t.category === 'Manutenção' || t.category === 'maintenance').reduce((acc, curr) => acc + curr.value, 0);
  const netResult = fTransactions.reduce((acc, curr) => acc + (curr.type === 'income' ? curr.value : -curr.value), 0);

  // Maintenance
  const openIncidents = incidents.filter(i => i.status === 'open').length;
  const inProgressIncidents = incidents.filter(i => i.status === 'in_progress').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'closed').length;

  // --- Charts Data ---

  const revenueEvolutionData = useMemo(() => {
    const last6 = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), 'yyyy-MM'));
    return last6.map(month => {
      const monthTrans = transactions.filter(t => t.date.startsWith(month) && t.type === 'income');
      return {
        name: format(parseISO(month + '-01'), 'MMM', { locale: ptBR }),
        valor: monthTrans.reduce((acc, curr) => acc + curr.value, 0)
      };
    });
  }, [transactions]);

  const occupancyData = [
    { name: 'Alugados', value: rentedProps },
    { name: 'Vagos', value: vacantProps },
    { name: 'Manutenção', value: fProperties.filter(p => p.status === 'maintenance').length }
  ];

  const delinquencyByMonthData = useMemo(() => {
    const last6 = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), 'yyyy-MM'));
    return last6.map(month => {
      const monthInsts = installments.filter(i => i.dueDate.startsWith(month) && i.status === 'overdue');
      return {
        name: format(parseISO(month + '-01'), 'MMM', { locale: ptBR }),
        valor: monthInsts.reduce((acc, curr) => acc + curr.value, 0)
      };
    });
  }, [installments]);

  const expensesByCategoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    fTransactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.value;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [fTransactions]);

  const propertiesByCityData = useMemo(() => {
    const cities: Record<string, number> = {};
    fProperties.forEach(p => {
      cities[p.city] = (cities[p.city] || 0) + 1;
    });
    return Object.entries(cities).map(([name, value]) => ({ name, value }));
  }, [fProperties]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 animate-in fade-in duration-500">
      {/* Header & Global Filters */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="text-petrol-600" size={24} />
                Dashboard Executiva
              </h1>
              <p className="text-xs text-slate-500 font-medium">Visão estratégica e operacional do seu portfólio imobiliário.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-xs font-bold">
                <Download size={14} /> Exportar PDF
              </Button>
              <Button size="sm" className="gap-2 text-xs font-bold">
                <Plus size={14} /> Nova Transação
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Período</label>
              <Select value={filters.period} onChange={e => setFilters({...filters, period: e.target.value})} className="h-8 text-xs">
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Cidade</label>
              <Select value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} className="h-8 text-xs">
                <option value="all">Todas</option>
                {Array.from(new Set(properties.map(p => p.city))).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Imóvel</label>
              <Select value={filters.property} onChange={e => setFilters({...filters, property: e.target.value})} className="h-8 text-xs">
                <option value="all">Todos</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Proprietário</label>
              <Select value={filters.owner} onChange={e => setFilters({...filters, owner: e.target.value})} className="h-8 text-xs">
                <option value="all">Todos</option>
                {owners.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Locatário</label>
              <Select value={filters.tenant} onChange={e => setFilters({...filters, tenant: e.target.value})} className="h-8 text-xs">
                <option value="all">Todos</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Status Contrato</label>
              <Select value={filters.leaseStatus} onChange={e => setFilters({...filters, leaseStatus: e.target.value})} className="h-8 text-xs">
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="expired">Expirado</option>
                <option value="terminated">Rescindido</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Pagamento</label>
              <Select value={filters.paymentStatus} onChange={e => setFilters({...filters, paymentStatus: e.target.value})} className="h-8 text-xs">
                <option value="all">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold uppercase" onClick={() => setFilters({
                period: '30', city: 'all', neighborhood: 'all', property: 'all', owner: 'all', tenant: 'all', leaseStatus: 'all', paymentStatus: 'all'
              })}>
                Limpar
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-petrol-900 text-white shadow-sm" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8 space-y-12">
        
        {/* SEÇÃO 1 — VISÃO GERAL */}
        {activeTab === 'overview' && (
          <section id="overview">
            <SectionHeader title="Visão Geral" subtitle="Indicadores macro do negócio" icon={TrendingUp} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total de Imóveis" value={totalProps.toString()} subValue="No portfólio" icon={Home} color="bg-slate-900" trend={5} />
              <StatCard title="Imóveis Alugados" value={rentedProps.toString()} subValue={`${Math.round((rentedProps/totalProps)*100 || 0)}% de ocupação`} icon={CheckCircle2} color="bg-emerald-600" trend={2} />
              <StatCard title="Contratos Ativos" value={activeLeasesCount.toString()} subValue={`${expiringLeases} vencendo em 30 dias`} icon={FileText} color="bg-petrol-600" trend={3} />
              <StatCard title="Receita Prevista (Mês)" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueExpected)} subValue={`${Math.round((revenueReceived/revenueExpected)*100 || 0)}% recebido`} icon={DollarSign} color="bg-indigo-600" trend={12} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Evolução da Receita Mensal</h3>
                <ChartContainer>
                  <AreaChart data={revenueEvolutionData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a3d40" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0a3d40" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="valor" stroke="#0a3d40" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ChartContainer>
              </Card>
              <Card className="p-6 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Taxa de Ocupação</h3>
                <ChartContainer>
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2 mt-4">
                  {occupancyData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                        <span className="text-slate-500">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* SEÇÃO 2 — FINANCEIRO */}
        {activeTab === 'financial' && (
          <section id="financial">
            <SectionHeader title="Financeiro" subtitle="Gestão de fluxo de caixa e inadimplência" icon={DollarSign} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total a Receber" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalToReceive)} icon={TrendingUp} color="bg-emerald-500" />
              <StatCard title="Total em Atraso" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOverdue)} icon={AlertTriangle} color="bg-red-500" />
              <StatCard title="Repassado Proprietários" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRemittance)} icon={ArrowUpRight} color="bg-petrol-600" />
              <StatCard title="Resultado Líquido" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netResult)} icon={Activity} color={netResult >= 0 ? "bg-emerald-600" : "bg-red-600"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Despesas por Categoria</h3>
                <ChartContainer>
                  <BarChart data={expensesByCategoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} width={100} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#0a3d40" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </Card>
              <Card className="p-6 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Inadimplência por Mês</h3>
                <ChartContainer>
                  <LineChart data={delinquencyByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="valor" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                  </LineChart>
                </ChartContainer>
              </Card>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Parcelas Vencidas</h3>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-petrol-600">Ver Todas</Button>
              </div>
              <DataTable 
                columns={[
                  { header: 'Locatário', render: (row: any) => {
                    const lease = leases.find(l => l.id === row.leaseId);
                    const tenant = tenants.find(t => t.id === lease?.tenantId);
                    return <div className="font-bold text-slate-900">{tenant?.name || 'N/A'}</div>;
                  }},
                  { header: 'Imóvel', render: (row: any) => row.propertyTitle },
                  { header: 'Vencimento', render: (row: any) => format(parseISO(row.dueDate), 'dd/MM/yyyy') },
                  { header: 'Valor', render: (row: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.value) },
                  { header: 'Status', render: (row: any) => <Badge variant="error">Atrasado</Badge> }
                ]}
                data={fInstallments.filter(i => i.status === 'overdue').slice(0, 5)}
              />
            </Card>
          </section>
        )}

        {/* SEÇÃO 3 — IMÓVEIS */}
        {activeTab === 'properties' && (
          <section id="properties">
            <SectionHeader title="Imóveis" subtitle="Análise do portfólio físico" icon={Home} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Cadastrados" value={properties.length.toString()} icon={Home} color="bg-slate-900" />
              <StatCard title="Ticket Médio Aluguel" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgRent)} icon={TrendingUp} color="bg-emerald-600" />
              <StatCard title="Em Manutenção" value={fProperties.filter(p => p.status === 'maintenance').length.toString()} icon={Wrench} color="bg-amber-500" />
              <StatCard title="Vagos" value={vacantProps.toString()} icon={Clock} color="bg-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Imóveis por Cidade</h3>
                <ChartContainer>
                  <BarChart data={propertiesByCityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </Card>
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Lista de Imóveis</h3>
                </div>
                <DataTable 
                  columns={[
                    { header: 'Imóvel', render: (row: any) => <div className="font-bold text-slate-900">{row.title}</div> },
                    { header: 'Cidade', accessor: 'city' },
                    { header: 'Valor Aluguel', render: (row: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.rentValue) },
                    { header: 'Status', render: (row: any) => (
                      <Badge variant={row.status === 'rented' ? 'success' : row.status === 'vacant' ? 'warning' : 'error'}>
                        {row.status === 'rented' ? 'Alugado' : row.status === 'vacant' ? 'Vago' : 'Manutenção'}
                      </Badge>
                    )}
                  ]}
                  data={fProperties.slice(0, 5)}
                />
              </Card>
            </div>
          </section>
        )}

        {/* SEÇÃO 4 — LOCATÁRIOS */}
        {activeTab === 'tenants' && (
          <section id="tenants">
            <SectionHeader title="Locatários" subtitle="Perfil e comportamento dos inquilinos" icon={Users} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Locatários Ativos" value={tenants.length.toString()} icon={Users} color="bg-petrol-600" />
              <StatCard title="Inadimplentes" value={installments.filter(i => i.status === 'overdue').length.toString()} icon={AlertTriangle} color="bg-red-500" />
              <StatCard title="Renda Média" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tenants.reduce((acc, curr) => acc + (curr.income || 0), 0) / tenants.length || 0)} icon={TrendingUp} color="bg-emerald-600" />
              <StatCard title="Novos Contratos" value={fLeases.filter(l => l.status === 'active').length.toString()} icon={Plus} color="bg-indigo-600" />
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Locatários e Pagamentos</h3>
              </div>
              <DataTable 
                columns={[
                  { header: 'Locatário', render: (row: any) => <div className="font-bold text-slate-900">{row.name}</div> },
                  { header: 'Telefone', accessor: 'phone' },
                  { header: 'Renda', render: (row: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.income || 0) },
                  { header: 'Status', render: (row: any) => {
                    const lease = leases.find(l => l.tenantId === row.id);
                    const overdue = installments.some(i => i.leaseId === lease?.id && i.status === 'overdue');
                    return <Badge variant={overdue ? 'error' : 'success'}>{overdue ? 'Inadimplente' : 'Em dia'}</Badge>;
                  }}
                ]}
                data={tenants.slice(0, 5)}
              />
            </Card>
          </section>
        )}

        {/* SEÇÃO 5 — PROPRIETÁRIOS */}
        {activeTab === 'owners' && (
          <section id="owners">
            <SectionHeader title="Proprietários" subtitle="Gestão de repasses e relacionamento" icon={ShieldCheck} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Proprietários" value={owners.length.toString()} icon={Users} color="bg-slate-900" />
              <StatCard title="Repasse Pendente" value={installments.filter(i => i.status === 'paid' && i.remittanceStatus === 'pending').length.toString()} icon={Clock} color="bg-amber-500" />
              <StatCard title="Total a Repassar" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installments.filter(i => i.status === 'paid' && i.remittanceStatus === 'pending').reduce((acc, curr) => acc + curr.ownerValue, 0))} icon={DollarSign} color="bg-emerald-600" />
              <StatCard title="Imóveis/Proprietário" value={(properties.length / owners.length || 0).toFixed(1)} icon={Home} color="bg-petrol-600" />
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Resumo de Proprietários</h3>
              </div>
              <DataTable 
                columns={[
                  { header: 'Proprietário', render: (row: any) => <div className="font-bold text-slate-900">{row.name}</div> },
                  { header: 'Imóveis', render: (row: any) => properties.filter(p => p.ownerId === row.id).length },
                  { header: 'Repasse Pendente', render: (row: any) => {
                    const pending = installments.filter(i => {
                      const lease = leases.find(l => l.id === i.leaseId);
                      return lease?.ownerId === row.id && i.status === 'paid' && i.remittanceStatus === 'pending';
                    }).reduce((acc, curr) => acc + curr.ownerValue, 0);
                    return <span className={pending > 0 ? "text-amber-600 font-bold" : "text-slate-400"}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pending)}</span>;
                  }}
                ]}
                data={owners.slice(0, 5)}
              />
            </Card>
          </section>
        )}

        {/* SEÇÃO 6 — MANUTENÇÃO E OCORRÊNCIAS */}
        {activeTab === 'maintenance' && (
          <section id="maintenance">
            <SectionHeader title="Manutenção" subtitle="Controle de chamados e reparos" icon={Wrench} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Incidentes Abertos" value={openIncidents.toString()} icon={AlertCircle} color="bg-red-500" />
              <StatCard title="Em Andamento" value={inProgressIncidents.toString()} icon={Clock} color="bg-amber-500" />
              <StatCard title="Resolvidos" value={resolvedIncidents.toString()} icon={CheckCircle2} color="bg-emerald-600" />
              <StatCard title="Custo Total" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incidents.reduce((acc, curr) => acc + (curr.cost || 0), 0))} icon={DollarSign} color="bg-petrol-600" />
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Últimas Ocorrências</h3>
              </div>
              <DataTable 
                columns={[
                  { header: 'Imóvel', render: (row: any) => {
                    const prop = properties.find(p => p.id === row.propertyId);
                    return <div className="font-bold text-slate-900">{prop?.title || 'N/A'}</div>;
                  }},
                  { header: 'Categoria', accessor: 'category' },
                  { header: 'Status', render: (row: any) => (
                    <Badge variant={row.status === 'open' ? 'error' : row.status === 'in_progress' ? 'warning' : 'success'}>
                      {row.status === 'open' ? 'Aberto' : row.status === 'in_progress' ? 'Em Andamento' : 'Fechado'}
                    </Badge>
                  )},
                  { header: 'Custo', render: (row: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.cost || 0) }
                ]}
                data={incidents.slice(0, 5)}
              />
            </Card>
          </section>
        )}

        {/* SEÇÃO 7 — PRESTADORES DE SERVIÇO */}
        {activeTab === 'vendors' && (
          <section id="vendors">
            <SectionHeader title="Prestadores de Serviço" subtitle="Rede de parceiros e fornecedores" icon={Truck} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Prestadores" value={vendors.length.toString()} icon={Truck} color="bg-slate-900" />
              <StatCard title="Avaliação Média" value={(vendors.reduce((acc, curr) => acc + curr.rating, 0) / vendors.length || 0).toFixed(1)} icon={TrendingUp} color="bg-emerald-600" />
              <StatCard title="Serviços Realizados" value={vendors.reduce((acc, curr) => acc + curr.completedJobs, 0).toString()} icon={CheckCircle2} color="bg-petrol-600" />
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fornecedores Parceiros</h3>
              </div>
              <DataTable 
                columns={[
                  { header: 'Fornecedor', render: (row: any) => <div className="font-bold text-slate-900">{row.name}</div> },
                  { header: 'Serviço', accessor: 'service' },
                  { header: 'Cidade', accessor: 'city' },
                  { header: 'Avaliação', render: (row: any) => <div className="flex items-center gap-1 text-amber-500 font-bold">{row.rating} ★</div> }
                ]}
                data={vendors.slice(0, 5)}
              />
            </Card>
          </section>
        )}

        {/* SEÇÃO 8 — VISTORIAS */}
        {activeTab === 'inspections' && (
          <section id="inspections">
            <SectionHeader title="Vistorias" subtitle="Controle de estado dos imóveis" icon={ClipboardList} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Vistorias" value={inspections.length.toString()} icon={ClipboardList} color="bg-slate-900" />
              <StatCard title="Vistorias Entrada" value={inspections.filter(i => i.type === 'entry').length.toString()} icon={Plus} color="bg-emerald-600" />
              <StatCard title="Vistorias Saída" value={inspections.filter(i => i.type === 'exit').length.toString()} icon={TrendingDown} color="bg-red-500" />
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Histórico de Vistorias</h3>
              </div>
              <DataTable 
                columns={[
                  { header: 'Imóvel', render: (row: any) => {
                    const prop = properties.find(p => p.id === row.propertyId);
                    return <div className="font-bold text-slate-900">{prop?.title || 'N/A'}</div>;
                  }},
                  { header: 'Tipo', render: (row: any) => row.type === 'entry' ? 'Entrada' : row.type === 'exit' ? 'Saída' : 'Rotina' },
                  { header: 'Data', render: (row: any) => format(parseISO(row.date), 'dd/MM/yyyy') },
                  { header: 'Status', render: (row: any) => <Badge variant={row.status === 'completed' ? 'success' : 'warning'}>{row.status === 'completed' ? 'Concluída' : 'Agendada'}</Badge> }
                ]}
                data={inspections.slice(0, 5)}
              />
            </Card>
          </section>
        )}

        {/* SEÇÃO 9 — AUDITORIA */}
        {activeTab === 'audit' && (
          <section id="audit">
            <SectionHeader title="Auditoria do Sistema" subtitle="Rastreabilidade e segurança" icon={Shield} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Logs Hoje" value={auditLogs.filter(l => l.created_at?.startsWith(format(new Date(), 'yyyy-MM-dd'))).length.toString()} icon={History} color="bg-slate-900" />
              <StatCard title="Usuários Ativos" value={Array.from(new Set(auditLogs.map(l => l.user_id))).length.toString()} icon={Users} color="bg-petrol-600" />
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Logs Recentes</h3>
              </div>
              <DataTable 
                columns={[
                  { header: 'Usuário', accessor: 'user_id' },
                  { header: 'Ação', accessor: 'action' },
                  { header: 'Tabela', accessor: 'table_name' },
                  { header: 'Data', render: (row: any) => row.created_at ? format(parseISO(row.created_at), 'dd/MM HH:mm') : 'N/A' }
                ]}
                data={auditLogs.slice(0, 10)}
              />
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};
