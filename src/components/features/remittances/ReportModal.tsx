import React from 'react';
import { Printer, Download } from 'lucide-react';
import { Modal, Button, Input } from '../../ui';
import { Owner } from '../../../types';
import { formatCurrencyBRL, formatDateBR, formatMonthYear } from '../../../utils/formatters';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
}) => {
  const owner = reportData?.owner;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prestação de Contas ao Proprietário"
      className="max-w-4xl"
      footer={
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir
            </Button>
            <Button variant="outline" className="gap-2">
              <Download size={16} />
              Baixar PDF
            </Button>
          </div>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {reportData && owner && (
          <div className="bg-white border border-slate-300 p-8 shadow-sm font-serif text-slate-900 printable-area">
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 inline-block">
                RELAÇÃO DE PAGAMENTOS - {owner.name.toUpperCase()}
              </h2>
            </div>

            <table className="w-full border-collapse border border-slate-900 text-xs mb-8">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-900 p-2 text-left uppercase">Imóvel</th>
                  <th className="border border-slate-900 p-2 text-left uppercase">Mês/Ref</th>
                  <th className="border border-slate-900 p-2 text-left uppercase">Aluguel</th>
                  <th className="border border-slate-900 p-2 text-left uppercase">Tx. Adm.</th>
                  <th className="border border-slate-900 p-2 text-left uppercase">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {reportData.installments.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-slate-900 p-2 uppercase">IMÓVEL R= {item.property}</td>
                    <td className="border border-slate-900 p-2 uppercase">
                      {(() => {
                        const [year, month, day] = item.dueDate.split('-').map(Number);
                        const date = new Date(year, month - 1, day || 1);
                        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
                      })()}
                    </td>
                    <td className="border border-slate-900 p-2">
                      {formatCurrencyBRL(item.rent)}
                    </td>
                    <td className="border border-slate-900 p-2">
                      {formatCurrencyBRL(item.fee)}
                    </td>
                    <td className="border border-slate-900 p-2 font-bold">
                      {formatCurrencyBRL(item.net)}
                    </td>
                  </tr>
                ))}
                
                {/* Maintenance Expenses Section */}
                {reportData.maintenanceExpenses && reportData.maintenanceExpenses.length > 0 && (
                  <>
                    <tr className="bg-slate-100">
                      <th colSpan={5} className="border border-slate-900 p-2 text-left uppercase font-bold">
                        Despesas de Manutenção
                      </th>
                    </tr>
                    {reportData.maintenanceExpenses.map((expense: any, idx: number) => (
                      <tr key={`exp-${idx}`}>
                        <td className="border border-slate-900 p-2 uppercase">MANUT: {expense.property}</td>
                        <td className="border border-slate-900 p-2 uppercase">
                          {formatDateBR(expense.date)}
                        </td>
                        <td colSpan={2} className="border border-slate-900 p-2 italic">
                          {expense.description}
                        </td>
                        <td className="border border-slate-900 p-2 text-red-600 font-bold">
                          - {formatCurrencyBRL(expense.value)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="bg-slate-50 font-bold">
                  <td colSpan={2} className="border border-slate-900 p-2 uppercase">TOTAL LÍQUIDO A REPASSAR</td>
                  <td className="border border-slate-900 p-2">
                    {formatCurrencyBRL(reportData.totalRent)}
                  </td>
                  <td className="border border-slate-900 p-2">
                    {formatCurrencyBRL(reportData.totalFee)}
                  </td>
                  <td className="border border-slate-900 p-2 text-lg">
                    {formatCurrencyBRL(reportData.totalNet)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="space-y-4 text-sm leading-relaxed">
              <p className="font-bold">
                RECEBI A IMPORTÂNCIA DE {formatCurrencyBRL(reportData.totalNet).toUpperCase()}, REPRESENTADA PELOS LANÇAMENTOS ACIMA DESCRITOS.
              </p>
              <p className="mt-8">
                CONFERI E ACHEI EXATA A IMPORTÂNCIA, QUE CONSTITUI O REPASSE DOS ALUGUÉIS DOS IMÓVEIS ACIMA DESCRITOS.
              </p>
              
              <div className="mt-16 flex justify-between items-end">
                <div className="text-center w-64">
                  <div className="border-t border-slate-900 pt-2">
                    <p className="font-bold">{owner.name}</p>
                    <p className="text-xs">Proprietário</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p>Gerado em: {formatDateBR(new Date().toISOString())}</p>
                  <p>ImobiGestão - Sistema de Administração Imobiliária</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Modal>
  );
};
