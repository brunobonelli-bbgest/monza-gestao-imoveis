import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { Modal, Button } from '../../ui';
import { Installment, Lease, Property, Owner } from '../../../types';
import { formatCurrencyBRL, formatDateBR } from '../../../utils/formatters';

interface RemittanceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  leasesById: Record<string, Lease>;
  propertiesById: Record<string, Property>;
  ownersById: Record<string, Owner>;
}

export const RemittanceReceiptModal: React.FC<RemittanceReceiptModalProps> = ({
  isOpen,
  onClose,
  installment,
  leasesById,
  propertiesById,
  ownersById,
}) => {
  if (!installment) return null;

  const lease = leasesById[installment.leaseId];
  const property = lease ? propertiesById[lease.propertyId] : undefined;
  const owner = lease ? ownersById[lease.ownerId] : undefined;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recibo de Repasse ao Proprietário"
      className="max-w-2xl print:p-0"
    >
      <div className="p-8 bg-white print:shadow-none" id="remittance-receipt-content">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">ImobiGestão</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Soluções Imobiliárias</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900 uppercase">Recibo de Repasse</p>
            <p className="text-xs text-slate-500">Nº {installment.id.split('-')[1] || installment.id.substring(0, 8)}</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-slate-800 leading-relaxed">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-sm font-bold uppercase text-slate-500">Valor do Repasse:</span>
            <span className="text-2xl font-black text-slate-900">{formatCurrencyBRL(installment.ownerValue)}</span>
          </div>

          <p>
            Repassamos a <span className="font-bold">{owner?.name || installment.ownerName}</span>, a importância líquida de 
            <span className="font-bold italic"> {formatCurrencyBRL(installment.ownerValue)}</span>, 
            referente ao aluguel do imóvel <span className="font-bold">{property?.title || installment.propertyTitle}</span> situado em 
            <span className="font-bold"> {property?.address}, {property?.neighborhood}, {property?.city}</span>, 
            correspondente ao mês de <span className="font-bold">
              {(() => {
                const [year, month, day] = installment.dueDate.split('-').map(Number);
                const date = new Date(year, month - 1, day || 1);
                return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              })()}
            </span>.
          </p>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="font-bold mb-2 text-xs uppercase text-slate-500">Detalhamento do Repasse:</p>
            <div className="grid grid-cols-2 gap-y-1 text-xs">
              <span>Valor Total Recebido:</span>
              <span className="text-right">{formatCurrencyBRL(installment.value)}</span>
              
              <span className="text-red-600 font-medium">(-) Taxa de Administração ({lease?.managementFee || 5}%):</span>
              <span className="text-right text-red-600">-{formatCurrencyBRL(installment.agencyFeeValue)}</span>
              
              <div className="col-span-2 border-t my-1"></div>
              <span className="font-bold">VALOR LÍQUIDO REPASSADO:</span>
              <span className="font-bold text-right">{formatCurrencyBRL(installment.ownerValue)}</span>
            </div>
          </div>

          <div className="pt-12 flex flex-col items-center">
            <div className="w-64 border-t border-slate-900 mb-2"></div>
            <p className="text-xs font-bold uppercase text-slate-500">ImobiGestão - Administradora</p>
            <p className="text-[10px] text-slate-400 mt-1">{formatDateBR(new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 print:hidden">
        <Button variant="outline" onClick={onClose} className="gap-2">
          <X size={16} />
          Fechar
        </Button>
        <Button variant="outline" className="gap-2">
          <Download size={16} />
          PDF
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={16} />
          Imprimir Recibo
        </Button>
      </div>
    </Modal>
  );
};
