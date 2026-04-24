import React from 'react';
import { Calendar, Receipt, CheckCircle, Download, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui';
import { cn } from '../../../utils/cn';
import { Installment, Lease, Property, Owner, Transaction } from '../../../types';
import { formatCurrencyBRL } from '../../../utils/formatters';

interface RemittancesTableProps {
  remittances: Installment[];
  transactions: Transaction[];
  leasesById: Record<string, Lease>;
  propertiesById: Record<string, Property>;
  ownersById: Record<string, Owner>;
  onGenerateReceipt: (inst: Installment) => void;
  onConfirmRemittance: (inst: Installment) => void;
  onDeleteRemittance: (id: string) => void;
  onUpdateInstallment: (inst: Installment) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export const RemittancesTable: React.FC<RemittancesTableProps> = ({
  remittances,
  transactions,
  leasesById,
  propertiesById,
  ownersById,
  onGenerateReceipt,
  onConfirmRemittance,
  onDeleteRemittance,
  onUpdateInstallment,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}) => {
  if (!Array.isArray(remittances)) {
    console.error("[RemittancesTable] 'remittances' prop is not an array:", remittances);
    return null;
  }

  const allSelected = remittances.length > 0 && selectedIds.length === remittances.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 w-[40px]">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-petrol-600 focus:ring-petrol-500"
                checked={allSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Proprietário / Imóvel</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Competência</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Líquido Prop.</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lançamento</th>
            <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {remittances.map((inst) => {
            if (!inst) {
              console.error("[RemittancesTable] Found null/undefined installment in list");
              return null;
            }
            const lease = leasesById ? leasesById[inst.leaseId] : undefined;
            const property = (lease && propertiesById) ? propertiesById[lease.propertyId] : undefined;
            const owner = (lease && ownersById) ? ownersById[lease.ownerId] : undefined;

            const ownerName = owner?.name || inst.ownerName || 'Legado (Contrato Excluído)';
            const propertyTitle = property?.title || inst.propertyTitle || 'Imóvel não identificado';
            const isSelected = selectedIds.includes(inst.id);

            // Check for pending maintenance transactions for this owner/property
            const hasPendingMaintenance = transactions.some(t => 
              !t.isDeleted && 
              t.ownerId === owner?.id && 
              t.propertyId === property?.id &&
              t.category === 'Manutenção' &&
              t.status === 'pending'
            );

            return (
              <tr 
                key={inst.id} 
                className={cn(
                  "transition-all border-l-4 text-xs text-slate-600",
                  inst.remittanceStatus === 'completed' 
                    ? "bg-emerald-50 border-l-emerald-500 hover:bg-emerald-100" 
                    : "bg-amber-50 border-l-amber-500 hover:bg-amber-100",
                  isSelected && "bg-indigo-50/50"
                )}
              >
                <td className="px-4 py-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-petrol-600 focus:ring-petrol-500"
                    checked={isSelected}
                    onChange={() => onToggleSelect(inst.id)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0">
                      {ownerName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 truncate">{ownerName}</p>
                        {hasPendingMaintenance && (
                          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 animate-pulse" title="Manutenção pendente de desconto">
                            <AlertTriangle size={10} />
                            <span className="text-[8px] font-black uppercase">Manut.</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{propertyTitle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">
                      {(() => {
                        const [year, month, day] = inst.dueDate.split('-').map(Number);
                        const date = new Date(year, month - 1, day || 1);
                        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      })()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-900">
                    {formatCurrencyBRL(inst.ownerValue)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className={cn(
                    "flex items-center justify-center w-16 h-6 rounded text-[9px] font-bold uppercase border",
                    inst.remittanceStatus === 'completed' 
                      ? "bg-teal-100 text-teal-700 border-teal-200" 
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  )}>
                    {inst.remittanceStatus === 'completed' ? 'Realizado' : 'Pendente'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col text-[10px]">
                    <span className="font-medium">{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                    <span>{inst.createdAt ? new Date(inst.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1.5 items-center">
                    {inst.remittanceStatus === 'completed' && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onGenerateReceipt(inst)}
                          title="Gerar Recibo Locatário"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Receipt size={14} />
                        </button>
                        <div className="flex items-center gap-1">
                          <label className="cursor-pointer p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Anexar Recibo de Repasse">
                            <Download size={14} className="rotate-180" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Simulate upload
                                  const mockUrl = URL.createObjectURL(file);
                                  onUpdateInstallment({
                                    ...inst,
                                    remittanceReceiptUrl: mockUrl
                                  });
                                  alert(`Arquivo ${file.name} anexado com sucesso.`);
                                }
                              }}
                            />
                          </label>
                          {inst.remittanceReceiptUrl && (
                            <button 
                              onClick={() => window.open(inst.remittanceReceiptUrl, '_blank')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Visualizar Recibo de Repasse"
                            >
                              <FileText size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {inst.remittanceStatus === 'pending' && (
                        <Button 
                          size="sm" 
                          className="h-7 px-2 text-[9px] gap-1 whitespace-nowrap"
                          onClick={() => onConfirmRemittance(inst)}
                        >
                          <CheckCircle size={12} />
                          Repassar
                        </Button>
                      )}
                      <button 
                        onClick={() => onDeleteRemittance(inst.id)}
                        title="Excluir Repasse"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
          {remittances.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                Nenhum repasse encontrado com os filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
