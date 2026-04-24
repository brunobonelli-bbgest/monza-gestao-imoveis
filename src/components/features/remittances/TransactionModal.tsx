import React from 'react';
import { Modal, Button, Input } from '../../ui';
import { cn } from '../../../utils/cn';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transaction: {
    description: string;
    type: 'income' | 'expense';
    category: string;
    value: string;
    date: string;
    competenceDate: string;
  };
  onChange: (data: any) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  onChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Lançamento - Fluxo de Caixa"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>Salvar Lançamento</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                  transaction.type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                )}
                onClick={() => onChange({...transaction, type: 'income'})}
              >
                Entrada
              </button>
              <button 
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                  transaction.type === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-slate-500"
                )}
                onClick={() => onChange({...transaction, type: 'expense'})}
              >
                Saída
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
            <Input 
              type="date" 
              value={transaction.date}
              onChange={e => onChange({...transaction, date: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Competência</label>
            <Input 
              type="month" 
              value={transaction.competenceDate}
              onChange={e => onChange({...transaction, competenceDate: e.target.value})}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
          <Input 
            placeholder="Ex: Pagamento Internet, Honorários..." 
            value={transaction.description}
            onChange={e => onChange({...transaction, description: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
            <select 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
              value={transaction.category}
              onChange={e => onChange({...transaction, category: e.target.value})}
            >
              <option>Aluguel</option>
              <option>Taxa Administrativa</option>
              <option>Repasse Proprietário</option>
              <option>Manutenção</option>
              <option>Marketing</option>
              <option>Salários</option>
              <option>Impostos</option>
              <option>Outros</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Valor</label>
            <Input 
              type="number" 
              placeholder="0,00" 
              value={transaction.value}
              onChange={e => onChange({...transaction, value: e.target.value})}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
