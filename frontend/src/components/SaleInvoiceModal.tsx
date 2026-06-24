import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { salesApi } from '../api';
import InvoiceDocument from './invoice/InvoiceDocument';
import InvoiceModalShell from './invoice/InvoiceModalShell';
import type { InvoiceData } from './invoice/invoiceTypes';

interface SaleInvoiceModalProps {
  saleId: number | null;
  onClose: () => void;
}

export default function SaleInvoiceModal({ saleId, onClose }: SaleInvoiceModalProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!saleId) {
      setInvoice(null);
      return;
    }
    setLoading(true);
    salesApi
      .getReceipt(saleId)
      .then((res) => {
        const r = res.data.data.receipt;
        setInvoice({
          storeName: r.storeName,
          documentType: 'INVOICE',
          documentNo: String(r.saleId).padStart(5, '0'),
          saleId: r.saleId,
          date: r.date,
          cashier: r.cashier,
          customer: r.customer,
          items: r.items,
          total: r.total,
          payment: r.payment,
        });
      })
      .catch(() => {
        toast.error('Failed to load invoice');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [saleId, onClose]);

  if (!saleId) return null;

  return (
    <InvoiceModalShell
      title="Sale Invoice"
      filename={`sale-invoice-${saleId}.pdf`}
      loading={loading}
      ready={!!invoice}
      onClose={onClose}
    >
      {invoice && <InvoiceDocument data={invoice} />}
    </InvoiceModalShell>
  );
}
