import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Mail, 
  Filter, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Printer,
  ClipboardCheck,
  Trash2
} from 'lucide-react';
import { Card, Button, Badge, Input } from '../../components/ui';
import { cn } from '../../utils/cn';
import { useData } from '../../context/DataContext';
import { formatDateBR } from '../../utils/formatters';

export const Reports = () => {
  const [activeTab, setActiveTab] = useState('owners');
  const { auditLogs, owners, clearAuditLogs, properties, leases, tenants, installments } = useData();
  const [selectedOwnerId, setSelectedOwnerId] = useState('all');
  const [selectedTenantId, setSelectedTenantId] = useState('all');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  const reports = [
    { id: 'owners', label: 'Extrato de Proprietários', icon: TrendingUp },
    { id: 'tenants', label: 'Extrato Locatários', icon: FileText },
    { id: 'overdue', label: 'Inadimplência', icon: AlertCircle },
    { id: 'occupancy', label: 'Ocupação e Vacância', icon: BarChart3 },
    { id: 'audit', label: 'Auditoria de Exclusões', icon: ClipboardCheck },
  ];

  const handleExportAudit = () => {
    const headers = ['Data', 'Usuário ID', 'Ação', 'Tabela', 'Registro ID', 'Dados Antigos'];
    const rows = auditLogs.map(log => {
      let dateStr = 'N/A';
      try {
        if (log.created_at) dateStr = new Date(log.created_at).toLocaleString('pt-BR');
      } catch (e) {
        console.error("Invalid audit log timestamp", log.created_at);
      }
      
      return [
        dateStr,
        log.user_id,
        log.action,
        log.table_name,
        log.record_id,
        JSON.stringify(log.old_data)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios e BI</h1>
          <p className="text-slate-500">Gere documentos e analise o desempenho da sua imobiliária.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer size={16} />
            Imprimir
          </Button>
          <Button 
            className="gap-2"
            onClick={activeTab === 'audit' ? handleExportAudit : undefined}
          >
            <Download size={16} />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 p-2 h-fit">
          <div className="space-y-1">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveTab(report.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === report.id 
                    ? "bg-petrol-900 text-white shadow-md" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <report.icon size={18} />
                {report.label}
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 mb-6">Parâmetros do Relatório</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Período</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    className="w-full pl-10 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                  >
                    <option value="">Todos os Meses</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const val = d.toISOString().slice(0, 7);
                      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      return <option key={val} value={val}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {activeTab === 'tenants' ? 'Locatário' : 'Proprietário'}
                </label>
                <select 
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                  value={activeTab === 'tenants' ? selectedTenantId : selectedOwnerId}
                  onChange={(e) => activeTab === 'tenants' ? setSelectedTenantId(e.target.value) : setSelectedOwnerId(e.target.value)}
                >
                  <option value="all">
                    {activeTab === 'tenants' ? 'Todos os Locatários' : 'Todos os Proprietários'}
                  </option>
                  {activeTab === 'tenants' ? (
                    tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))
                  ) : (
                    owners.map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2">
                  <Filter size={16} />
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </Card>

          {activeTab === 'owners' ? (
            <div className="space-y-6">
              <Card className="p-0 overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">Extrato Cronológico de Repasses - Proprietários</h3>
                  <p className="text-xs text-slate-500 mt-1">Histórico detalhado de todos os repasses realizados aos proprietários.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lançamento</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Proprietário</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Imóvel</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Competência</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Valor Repassado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const completedRemittances = installments
                          .filter(inst => inst.remittanceStatus === 'completed' && inst.remittanceDate)
                          .filter(inst => {
                            if (selectedOwnerId === 'all') return true;
                            const lease = leases.find(l => l.id === inst.leaseId);
                            return lease?.ownerId === selectedOwnerId;
                          })
                          .filter(inst => {
                            if (!reportMonth) return true;
                            return inst.remittanceDate?.startsWith(reportMonth);
                          })
                          .sort((a, b) => (b.remittanceDate || '').localeCompare(a.remittanceDate || ''));

                        if (completedRemittances.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                Nenhum repasse encontrado para os filtros selecionados.
                              </td>
                            </tr>
                          );
                        }

                        return completedRemittances.map(inst => {
                          const lease = leases.find(l => l.id === inst.leaseId);
                          const owner = owners.find(o => o.id === lease?.ownerId);
                          const property = properties.find(p => p.id === lease?.propertyId);
                          
                          return (
                            <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-medium text-slate-900">
                                {inst.createdAt ? new Date(inst.createdAt).toLocaleString('pt-BR') : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-900">{owner?.name || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-slate-700">{property?.title || 'N/A'}</span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{property?.address}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600">
                                {(() => {
                                  const [year, month, day] = inst.dueDate.split('-').map(Number);
                                  const date = new Date(year, month - 1, day || 1);
                                  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                                })()}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.ownerValue)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : activeTab === 'tenants' ? (
            <div className="space-y-6">
              <Card className="p-0 overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">Extrato Cronológico de Recebimentos - Locatários</h3>
                  <p className="text-xs text-slate-500 mt-1">Histórico detalhado de todos os pagamentos realizados pelos locatários.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lançamento</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Locatário</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Imóvel</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vencimento</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Valor Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const paidInstallments = installments
                          .filter(inst => inst.status === 'paid' && inst.paidAt)
                          .filter(inst => {
                            if (selectedTenantId === 'all') return true;
                            const lease = leases.find(l => l.id === inst.leaseId);
                            return lease?.tenantId === selectedTenantId;
                          })
                          .filter(inst => {
                            if (!reportMonth) return true;
                            return inst.paidAt?.startsWith(reportMonth);
                          })
                          .sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''));

                        if (paidInstallments.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                Nenhum pagamento encontrado para os filtros selecionados.
                              </td>
                            </tr>
                          );
                        }

                        return paidInstallments.map(inst => {
                          const lease = leases.find(l => l.id === inst.leaseId);
                          const tenant = tenants.find(t => t.id === lease?.tenantId);
                          const property = properties.find(p => p.id === lease?.propertyId);
                          
                          return (
                            <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-medium text-slate-900">
                                {inst.createdAt ? new Date(inst.createdAt).toLocaleString('pt-BR') : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-900">{tenant?.name || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-slate-700">{property?.title || 'N/A'}</span>
                                  <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{property?.address}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600">
                                {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : activeTab === 'occupancy' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-white border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total de Imóveis</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{properties.length}</p>
                </Card>
                <Card className="p-4 bg-white border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ocupados</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {properties.filter(p => p.status === 'rented').length}
                  </p>
                </Card>
                <Card className="p-4 bg-white border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vagos</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {properties.filter(p => p.status === 'vacant').length}
                  </p>
                </Card>
              </div>

              <Card className="p-0 overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">Relatório de Ocupação e Vacância</h3>
                  <p className="text-xs text-slate-500 mt-1">Status atual e histórico de contratos por imóvel.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Imóvel</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Atual</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contratos</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Última Vigência</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Atual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {properties.map(property => {
                        const propertyLeases = leases.filter(l => l.propertyId === property.id);
                        const lastLease = [...propertyLeases].sort((a, b) => b.endDate.localeCompare(a.endDate))[0];

                        return (
                          <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">{property.title}</span>
                                <span className="text-[10px] text-slate-500">{property.address}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={property.status === 'rented' ? 'success' : 'warning'}>
                                {property.status === 'rented' ? 'Ocupado' : 'Vago'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {propertyLeases.length} contrato(s)
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600">
                              {lastLease ? `${new Date(lastLease.startDate).toLocaleDateString('pt-BR')} - ${new Date(lastLease.endDate).toLocaleDateString('pt-BR')}` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.rentValue)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : activeTab === 'audit' ? (
            <Card className="p-0 overflow-hidden border-slate-200">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900">Log de Auditoria de Exclusões</h3>
                  <p className="text-xs text-slate-500 mt-1">Registro de todas as exclusões realizadas no sistema para fins de conformidade.</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 gap-2" onClick={clearAuditLogs}>
                  <Trash2 size={14} />
                  Limpar Logs
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data/Hora</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuário ID</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ação</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tabela</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registro ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      try {
                        const logs = auditLogs || [];
                        if (logs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                Nenhum registro de auditoria encontrado.
                              </td>
                            </tr>
                          );
                        }
                        return logs.map((log, idx) => {
                          if (!log) return null;
                          const safeId = log.id || `log-idx-${idx}`;
                          return (
                            <tr key={safeId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs font-medium text-slate-900 whitespace-nowrap">
                                {(() => {
                                  try {
                                    if (!log.created_at) return 'N/A';
                                    return new Date(log.created_at).toLocaleString('pt-BR');
                                  } catch (e) {
                                    return 'Data Inválida';
                                  }
                                })()}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600">
                                {log.user_id || 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant={log.action === 'DELETE' ? 'error' : 'info'}>
                                  {log.action}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600">
                                {log.table_name}
                              </td>
                              <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">
                                {log.record_id}
                              </td>
                            </tr>
                          );
                        });
                      } catch (err) {
                        console.error("Critical error rendering audit logs:", err);
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-red-500 italic">
                              Erro ao carregar registros de auditoria.
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-8 border-dashed border-2 border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-300 mb-4">
                <FileText size={32} />
              </div>
              <h4 className="font-bold text-slate-900">Prévia do Relatório</h4>
              <p className="text-sm text-slate-500 max-w-xs mt-2">
                Selecione os parâmetros acima e clique em "Gerar Relatório" para visualizar os dados aqui.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-lg">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-slate-200 rounded animate-pulse"></div>
                ))}
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-3 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
