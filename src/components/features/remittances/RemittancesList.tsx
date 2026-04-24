import React from 'react';
import { 
  Search, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  FileText,
  Plus
} from 'lucide-react';
import { Card, Button, Input, Modal } from '../../ui';
import { cn } from '../../../utils/cn';
import { useRemittancesViewModel } from '../../../hooks/useRemittancesViewModel';
import { formatCurrencyBRL } from '../../../utils/formatters';
import { RemittancesTable } from './RemittancesTable';
import { CashflowTable } from './CashflowTable';
import { ReportModal } from './ReportModal';
import { RemittanceReceiptModal } from './RemittanceReceiptModal';
import { TransactionModal } from './TransactionModal';
import { Trash2 } from 'lucide-react';

/**
 * RemittancesList Component
 * Refactored version with modular components and logic extracted to a custom hook.
 * 
 * Changelog:
 * - Extracted logic to useRemittancesViewModel hook.
 * - Modularized tables and modals.
 * - Added search functionality to Cash Flow tab.
 * - Improved type safety and performance with useMemo indices.
 * - Added print-specific CSS for reports and receipts.
 */
export const RemittancesList: React.FC = () => {
  const vm = useRemittancesViewModel();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão Financeira</h1>
          <p className="text-slate-500">Controle de repasses e fluxo de caixa da imobiliária.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit" role="tablist">
          <button 
            role="tab"
            aria-selected={vm.activeTab === 'repasses'}
            onClick={() => vm.setActiveTab('repasses')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              vm.activeTab === 'repasses' ? "bg-white text-petrol-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Repasses
          </button>
          <button 
            role="tab"
            aria-selected={vm.activeTab === 'contacorrente'}
            onClick={() => vm.setActiveTab('contacorrente')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              vm.activeTab === 'contacorrente' ? "bg-white text-petrol-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Conta Corrente
          </button>
        </div>
      </div>

      {vm.activeTab === 'repasses' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-amber-50 border-amber-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Aguardando Repasse</p>
                  <h3 className="text-2xl font-bold text-amber-900 mt-1">
                    {formatCurrencyBRL(vm.totals.pending)}
                  </h3>
                </div>
                <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm">
                  <Clock size={20} />
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-4 flex items-center gap-1">
                <AlertTriangle size={12} />
                {vm.filteredRemittances.filter(r => r.remittanceStatus === 'pending').length} repasses pendentes
              </p>
            </Card>

            <Card className="p-6 bg-emerald-50 border-emerald-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Repasses Realizados</p>
                  <h3 className="text-2xl font-bold text-emerald-900 mt-1">
                    {formatCurrencyBRL(vm.totals.completed)}
                  </h3>
                </div>
                <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <p className="text-xs text-emerald-700 mt-4 flex items-center gap-1">
                <TrendingUp size={12} />
                Mês atual
              </p>
            </Card>

            <Card className="p-6 bg-indigo-50 border-indigo-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Receita Imobiliária (Coletada)</p>
                  <h3 className="text-2xl font-bold text-indigo-900 mt-1">
                    {formatCurrencyBRL(vm.totals.agencyCollected)}
                  </h3>
                </div>
                <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-xs text-indigo-700 mt-4 flex items-center gap-1">
                <Clock size={12} />
                {formatCurrencyBRL(vm.totals.agencyPending)} aguardando coleta
              </p>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Buscar por imóvel, proprietário ou contrato..." 
                  className="pl-10" 
                  value={vm.searchTerm}
                  onChange={e => vm.setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase px-2">Proprietário</span>
                  <select 
                    className="h-8 text-xs border-none bg-transparent focus:ring-0 w-40 outline-none"
                    value={vm.selectedOwnerId}
                    onChange={e => vm.setSelectedOwnerId(e.target.value)}
                  >
                    <option value="all">Todos os Proprietários</option>
                    {vm.owners.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] font-bold uppercase px-2">Mês</span>
                  <select 
                    className="h-8 text-xs border-none bg-transparent focus:ring-0 w-40 outline-none"
                    value={vm.filterMonth}
                    onChange={e => vm.setFilterMonth(e.target.value)}
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

                <select 
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-petrol-500/20"
                  value={vm.statusFilter}
                  onChange={e => vm.setStatusFilter(e.target.value as any)}
                  aria-label="Filtrar por status"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="completed">Realizados</option>
                </select>

                <Button 
                  variant="outline" 
                  className="gap-2"
                  disabled={vm.selectedRemittanceIds.length === 0}
                  onClick={() => {
                    vm.setIsReportModalOpen(true);
                  }}
                  title={vm.selectedRemittanceIds.length === 0 ? "Selecione pelo menos um item para gerar o relatório" : "Gerar relatório de prestação de contas"}
                >
                  <FileText size={16} />
                  Prestação de Contas
                </Button>
              </div>
            </div>
          </Card>

          <RemittancesTable 
            remittances={vm.filteredRemittances}
            transactions={vm.transactions}
            leasesById={vm.leasesById}
            propertiesById={vm.propertiesById}
            ownersById={vm.ownersById}
            onGenerateReceipt={(inst) => {
              vm.setSelectedInstallmentForReceipt(inst);
              vm.setIsReceiptModalOpen(true);
            }}
            onConfirmRemittance={vm.handleConfirmRemittance}
            onDeleteRemittance={(id) => {
              vm.setItemToDelete({ id, type: 'remittance' });
              vm.setIsDeleteModalOpen(true);
            }}
            onUpdateInstallment={vm.updateInstallment}
            selectedIds={vm.selectedRemittanceIds}
            onToggleSelect={vm.handleToggleSelect}
            onToggleSelectAll={vm.handleToggleSelectAll}
          />
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo em Caixa</p>
              <h3 className={cn(
                "text-2xl font-bold mt-1",
                vm.cashFlowBalance >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {formatCurrencyBRL(vm.cashFlowBalance)}
              </h3>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp size={12} />
                  {formatCurrencyBRL(vm.filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0))} entradas
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-red-600 font-bold flex items-center gap-0.5">
                  <TrendingDown size={12} />
                  {formatCurrencyBRL(vm.filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0))} saídas
                </span>
              </div>
            </Card>
            
            <Card className="p-6 bg-emerald-50 border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Entradas (Filtrado)</p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">
                {formatCurrencyBRL(vm.filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0))}
              </h3>
            </Card>

            <Card className="p-6 bg-red-50 border-red-100">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Saídas (Filtrado)</p>
              <h3 className="text-2xl font-bold text-red-900 mt-1">
                {formatCurrencyBRL(vm.filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0))}
              </h3>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Buscar lançamentos..." 
                  className="pl-10" 
                  value={vm.cashFlowSearchTerm}
                  onChange={e => vm.setCashFlowSearchTerm(e.target.value)}
                  aria-label="Buscar lançamentos no fluxo de caixa"
                />
              </div>
              <Button className="gap-2" onClick={() => vm.setIsTransactionModalOpen(true)}>
                <Plus size={16} />
                Novo Lançamento
              </Button>
            </div>
          </Card>

          <CashflowTable 
            transactions={vm.filteredTransactions}
            onDelete={(id) => {
              vm.setItemToDelete({ id, type: 'transaction' });
              vm.setIsDeleteModalOpen(true);
            }}
          />
        </div>
      )}

      <ReportModal 
        isOpen={vm.isReportModalOpen}
        onClose={() => vm.setIsReportModalOpen(false)}
        reportData={vm.reportData}
      />

      <RemittanceReceiptModal 
        isOpen={vm.isReceiptModalOpen}
        onClose={() => vm.setIsReceiptModalOpen(false)}
        installment={vm.selectedInstallmentForReceipt}
        leasesById={vm.leasesById}
        propertiesById={vm.propertiesById}
        ownersById={vm.ownersById}
      />

      <Modal
        isOpen={vm.isDeleteModalOpen}
        onClose={() => vm.setIsDeleteModalOpen(false)}
        title={vm.itemToDelete?.type === 'remittance' ? "Excluir Repasse" : "Excluir Transação"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => vm.setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button 
              variant="danger" 
              onClick={vm.handleConfirmDelete}
              disabled={!vm.deleteJustification.trim()}
            >
              Confirmar Exclusão
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <p className="font-bold mb-1">Atenção!</p>
            <p>Tem certeza que deseja excluir este item? Esta ação removerá o registro permanentemente do fluxo de caixa.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Justificativa da Exclusão</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20 min-h-[100px]"
              placeholder="Descreva o motivo da exclusão..."
              value={vm.deleteJustification}
              onChange={e => vm.setDeleteJustification(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      <TransactionModal 
        isOpen={vm.isTransactionModalOpen}
        onClose={() => vm.setIsTransactionModalOpen(false)}
        onSave={vm.handleAddTransaction}
        transaction={vm.newTransaction}
        onChange={vm.setNewTransaction}
      />
    </div>
  );
};
