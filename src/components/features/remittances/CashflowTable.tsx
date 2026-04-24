import React from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '../../ui';
import { cn } from '../../../utils/cn';
import { Transaction } from '../../../types';
import { formatCurrencyBRL, formatDateBR } from '../../../utils/formatters';

interface CashflowTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const CashflowTable: React.FC<CashflowTableProps> = ({
  transactions,
  onDelete,
}) => {
  if (!Array.isArray(transactions)) {
    console.error("[CashflowTable] 'transactions' prop is not an array:", transactions);
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lançamento</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Competência</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((t) => {
            if (!t) {
              console.error("[CashflowTable] Found null/undefined transaction in list");
              return null;
            }
            return (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDateBR(t.date)}
                </td>
                <td className="px-6 py-4 text-[10px] text-slate-500">
                  <div className="flex flex-col">
                    <span className="font-medium">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                    <span>{t.createdAt ? new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {t.competenceDate ? t.competenceDate.split('-').reverse().join('/') : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {t.description}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="default" className="bg-slate-50">
                    {t.category}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-sm font-bold",
                    t.type === 'income' ? "text-emerald-600" : "text-red-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrencyBRL(t.value)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onDelete(t.id)}
                    title="Excluir Lançamento"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                Nenhum lançamento registrado no fluxo de caixa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
